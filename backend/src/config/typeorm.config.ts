import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModuleAsyncOptions } from '@nestjs/typeorm';

export const typeOrmConfig: TypeOrmModuleAsyncOptions = {
  imports: [ConfigModule],
  inject: [ConfigService],
  useFactory: (config: ConfigService) => ({
    type: 'postgres' as const,
    host: config.get<string>('POSTGRES_HOST', 'localhost'),
    port: config.get<number>('POSTGRES_PORT', 5432),
    username: config.get<string>('POSTGRES_USER', 'samokat'),
    password: config.get<string>('POSTGRES_PASSWORD', 'samokat'),
    database: config.get<string>('POSTGRES_DB', 'samokat_rent'),
    autoLoadEntities: true,
    synchronize: config.get<string>('SYNC_SCHEMA', 'true') === 'true',
    logging: config.get<string>('DB_LOGGING', 'false') === 'true',
    retryAttempts: 10,
    retryDelay: 2000,
  }),
};
