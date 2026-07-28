import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { typeOrmConfig } from './config/typeorm.config';
import { AuthModule } from './auth/auth.module';
import { ScootersModule } from './scooters/scooters.module';
import { CustomersModule } from './customers/customers.module';
import { RentalsModule } from './rentals/rentals.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { EventsModule } from './events/events.module';
import { SeedModule } from './seed/seed.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync(typeOrmConfig),
    EventsModule,
    SeedModule,
    AuthModule,
    ScootersModule,
    CustomersModule,
    RentalsModule,
    AnalyticsModule,
  ],
})
export class AppModule {}
