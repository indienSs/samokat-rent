import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Scooter } from './scooter.entity';
import { ScootersService } from './scooters.service';
import { ScootersController } from './scooters.controller';
import { EventsModule } from '../events/events.module';

@Module({
  imports: [TypeOrmModule.forFeature([Scooter]), EventsModule],
  providers: [ScootersService],
  controllers: [ScootersController],
  exports: [ScootersService],
})
export class ScootersModule {}
