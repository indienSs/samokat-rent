import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Rental } from './rental.entity';
import { Scooter } from '../scooters/scooter.entity';
import { Customer } from '../customers/customer.entity';
import { RentalsService } from './rentals.service';
import { RentalsController } from './rentals.controller';
import { EventsModule } from '../events/events.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Rental, Scooter, Customer]),
    EventsModule,
  ],
  providers: [RentalsService],
  controllers: [RentalsController],
  exports: [RentalsService],
})
export class RentalsModule {}
