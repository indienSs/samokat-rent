import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Scooter } from './scooter.entity';
import { CreateScooterDto } from './dto/create-scooter.dto';
import { UpdateScooterDto } from './dto/update-scooter.dto';
import { ListScootersDto } from './dto/list-scooters.dto';
import { EventsGateway } from '../events/events.gateway';

@Injectable()
export class ScootersService {
  constructor(
    @InjectRepository(Scooter) private readonly repo: Repository<Scooter>,
    private readonly events: EventsGateway,
  ) {}

  async list(query: ListScootersDto): Promise<Scooter[]> {
    const qb = this.repo.createQueryBuilder('s');

    if (query.status) {
      qb.andWhere('s.status = :status', { status: query.status });
    }
    if (query.q) {
      qb.andWhere('(s.number ILIKE :q OR s.model ILIKE :q)', {
        q: `%${query.q}%`,
      });
    }
    if (typeof query.minBattery === 'number') {
      qb.andWhere('s.battery_level >= :min', { min: query.minBattery });
    }
    if (typeof query.maxBattery === 'number') {
      qb.andWhere('s.battery_level <= :max', { max: query.maxBattery });
    }

    qb.orderBy('s."updatedAt"', 'DESC');
    return qb.getMany();
  }

  async findOne(id: string): Promise<Scooter> {
    const scooter = await this.repo.findOne({ where: { id } });
    if (!scooter) {
      throw new NotFoundException(`Самокат ${id} не найден`);
    }
    return scooter;
  }

  async create(dto: CreateScooterDto): Promise<Scooter> {
    const exists = await this.repo.findOne({ where: { number: dto.number } });
    if (exists) {
      throw new ConflictException(
        `Самокат с номером ${dto.number} уже существует`,
      );
    }
    const scooter = await this.repo.save(this.repo.create(dto));
    this.events.emitScooterChanged({ action: 'created', scooter });
    return scooter;
  }

  async update(id: string, dto: UpdateScooterDto): Promise<Scooter> {
    const scooter = await this.findOne(id);
    if (dto.number && dto.number !== scooter.number) {
      const dup = await this.repo.findOne({ where: { number: dto.number } });
      if (dup) {
        throw new ConflictException(
          `Самокат с номером ${dto.number} уже существует`,
        );
      }
    }
    Object.assign(scooter, dto);
    const saved = await this.repo.save(scooter);
    this.events.emitScooterChanged({ action: 'updated', scooter: saved });
    return saved;
  }

  async remove(id: string): Promise<void> {
    const scooter = await this.findOne(id);
    await this.repo.remove(scooter);
    this.events.emitScooterChanged({ action: 'deleted', scooter });
  }
}
