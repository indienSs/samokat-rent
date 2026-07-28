import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Rental, RentalWithDuration } from './rental.entity';
import { CreateRentalDto } from './dto/create-rental.dto';
import { ListRentalsDto } from './dto/list-rentals.dto';
import { Scooter } from '../scooters/scooter.entity';
import { Customer } from '../customers/customer.entity';
import { RentalStatus, ScooterStatus } from '../common/enums';
import { EventsGateway } from '../events/events.gateway';
import { PaginatedResult } from '../common/api-response';

@Injectable()
export class RentalsService {
  constructor(
    @InjectRepository(Rental) private readonly repo: Repository<Rental>,
    private readonly dataSource: DataSource,
    private readonly events: EventsGateway,
  ) {}

  async list(query: ListRentalsDto): Promise<PaginatedResult<RentalWithDuration>> {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 50;

    const qb = this.repo
      .createQueryBuilder('r')
      .leftJoinAndSelect('r.scooter', 'scooter')
      .leftJoinAndSelect('r.customer', 'customer')
      .orderBy('r.startedAt', 'DESC')
      .skip((page - 1) * pageSize)
      .take(pageSize);

    if (query.status) {
      qb.andWhere('r.status = :status', { status: query.status });
    }

    const [items, total] = await qb.getManyAndCount();
    const withDuration: RentalWithDuration[] = items.map((r) => {
      const end = r.endedAt ?? new Date();
      const durationMinutes =
        end.getTime() - new Date(r.startedAt).getTime() > 0
          ? Math.round(
              (end.getTime() - new Date(r.startedAt).getTime()) / 60000,
            )
          : 0;
      return Object.assign(r, { durationMinutes }) as RentalWithDuration;
    });

    return new PaginatedResult(withDuration, total, page, pageSize);
  }

  async findOne(id: string): Promise<Rental> {
    const rental = await this.repo.findOne({
      where: { id },
      relations: { scooter: true, customer: true },
    });
    if (!rental) {
      throw new NotFoundException(`Аренда ${id} не найдена`);
    }
    return rental;
  }

  async create(dto: CreateRentalDto): Promise<Rental> {
    return this.dataSource.transaction(async (manager) => {
      const scooter = await manager.findOne(Scooter, {
        where: { id: dto.scooterId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!scooter) {
        throw new NotFoundException(
          `Самокат ${dto.scooterId} не найден`,
        );
      }
      if (scooter.status !== ScooterStatus.AVAILABLE) {
        throw new ConflictException(
          `Самокат ${scooter.number} недоступен (статус: ${scooter.status})`,
        );
      }

      const customer = await manager.findOne(Customer, {
        where: { id: dto.customerId },
      });
      if (!customer) {
        throw new NotFoundException(
          `Клиент ${dto.customerId} не найден`,
        );
      }

      const rental = manager.create(Rental, {
        scooterId: scooter.id,
        customerId: customer.id,
        startedAt: dto.startedAt ? new Date(dto.startedAt) : new Date(),
        status: RentalStatus.ACTIVE,
      });
      const saved = await manager.save(rental);

      scooter.status = ScooterStatus.IN_USE;
      await manager.save(scooter);

      saved.scooter = scooter;
      saved.customer = customer;

      this.events.emitScooterChanged({ action: 'updated', scooter });
      this.events.emitRentalChanged({ action: 'created', rental: saved });
      return saved;
    });
  }

  async complete(id: string): Promise<Rental> {
    return this.dataSource.transaction(async (manager) => {
      const rental = await manager.findOne(Rental, {
        where: { id },
        relations: { scooter: true, customer: true },
      });
      if (!rental) {
        throw new NotFoundException(`Аренда ${id} не найдена`);
      }
      if (rental.status === RentalStatus.COMPLETED) {
        throw new BadRequestException('Аренда уже завершена');
      }

      const scooter = await manager.findOne(Scooter, {
        where: { id: rental.scooterId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!scooter) {
        throw new NotFoundException('Самокат аренды не найден');
      }

      rental.status = RentalStatus.COMPLETED;
      rental.endedAt = new Date();
      const saved = await manager.save(rental);

      if (scooter.status === ScooterStatus.IN_USE) {
        scooter.status = ScooterStatus.AVAILABLE;
        await manager.save(scooter);
        this.events.emitScooterChanged({ action: 'updated', scooter });
      }

      this.events.emitRentalChanged({ action: 'completed', rental: saved });
      return saved;
    });
  }
}
