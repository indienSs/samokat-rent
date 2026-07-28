import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';
import { Customer } from './customer.entity';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';

@Injectable()
export class CustomersService {
  constructor(
    @InjectRepository(Customer) private readonly repo: Repository<Customer>,
  ) {}

  async list(q?: string): Promise<Customer[]> {
    const qb = this.repo.createQueryBuilder('c').orderBy('c.createdAt', 'DESC');
    if (q) {
      qb.andWhere('(c.name ILIKE :q OR c.phone ILIKE :q)', { q: `%${q}%` });
    }
    return qb.getMany();
  }

  async findOne(id: string): Promise<Customer> {
    const customer = await this.repo.findOne({ where: { id } });
    if (!customer) {
      throw new NotFoundException(`Клиент ${id} не найден`);
    }
    return customer;
  }

  async create(dto: CreateCustomerDto): Promise<Customer> {
    const exists = await this.repo.findOne({
      where: { phone: ILike(dto.phone) },
    });
    if (exists) {
      throw new ConflictException(
        `Клиент с телефоном ${dto.phone} уже существует`,
      );
    }
    return this.repo.save(this.repo.create(dto));
  }

  async update(id: string, dto: UpdateCustomerDto): Promise<Customer> {
    const customer = await this.findOne(id);
    if (dto.phone && dto.phone !== customer.phone) {
      const dup = await this.repo.findOne({
        where: { phone: ILike(dto.phone) },
      });
      if (dup) {
        throw new ConflictException(
          `Клиент с телефоном ${dto.phone} уже существует`,
        );
      }
    }
    Object.assign(customer, dto);
    return this.repo.save(customer);
  }

  async remove(id: string): Promise<void> {
    const customer = await this.findOne(id);
    await this.repo.remove(customer);
  }
}
