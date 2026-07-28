import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Scooter } from '../scooters/scooter.entity';
import { Rental } from '../rentals/rental.entity';
import { Customer } from '../customers/customer.entity';
import {
  RentalStatus,
  SCOOTER_STATUSES,
  ScooterStatus,
} from '../common/enums';
import { AnalyticsOverview } from './analytics.types';

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectRepository(Scooter) private readonly scooters: Repository<Scooter>,
    @InjectRepository(Rental) private readonly rentals: Repository<Rental>,
    @InjectRepository(Customer) private readonly customers: Repository<Customer>,
  ) {}

  async getOverview(): Promise<AnalyticsOverview> {
    const statusRows = await this.scooters
      .createQueryBuilder('s')
      .select('s.status', 'status')
      .addSelect('COUNT(*)::int', 'count')
      .groupBy('s.status')
      .getRawMany<{ status: ScooterStatus; count: number }>();

    const byStatus = {} as Record<ScooterStatus, number>;
    for (const st of SCOOTER_STATUSES) {
      byStatus[st] = 0;
    }
    for (const row of statusRows) {
      byStatus[row.status] = Number(row.count) || 0;
    }
    const totalScooters = SCOOTER_STATUSES.reduce(
      (acc, st) => acc + byStatus[st],
      0,
    );

    const avgRow = await this.scooters
      .createQueryBuilder('s')
      .select('COALESCE(AVG(s.battery_level), 0)', 'avg')
      .getRawOne<{ avg: string }>();
    const averageBattery = Math.round(Number(avgRow?.avg ?? 0));

    const activeRentals = await this.rentals.countBy({
      status: RentalStatus.ACTIVE,
    });
    const completedRentals = await this.rentals.countBy({
      status: RentalStatus.COMPLETED,
    });

    const totalCustomers = await this.customers.count();

    return {
      byStatus,
      totalScooters,
      activeRentals,
      completedRentals,
      averageBattery,
      totalCustomers,
    };
  }
}
