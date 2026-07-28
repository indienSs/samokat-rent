import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../users/user.entity';
import { Scooter } from '../scooters/scooter.entity';
import { Customer } from '../customers/customer.entity';
import { Rental } from '../rentals/rental.entity';
import { SeedService } from './seed.service';
import { EventsModule } from '../events/events.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Scooter, Customer, Rental]),
    EventsModule,
  ],
  providers: [SeedService],
})
export class SeedModule {}
