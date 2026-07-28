import { ValidationPipe, Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/all-exceptions.filter';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bufferLogs: true,
  });

  // Глобальный префикс для всех REST-эндпоинтов: /api/...
  app.setGlobalPrefix('api', {
    // socket.io gateway живёт на /events — исключать не нужно, т.к. префикс
    // применяется только к HTTP-роутам.
  });

  // CORS для REST. WebSocket CORS настраивается отдельно в EventsGateway.
  const rawOrigins = process.env.CORS_ORIGINS ?? 'http://localhost:5173';
  const origins = rawOrigins
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);
  app.enableCors({
    origin: origins,
    credentials: true,
  });

  // Глобальная валидация: отбрасывать неизвестные поля, приводить типы.
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  app.useGlobalFilters(new AllExceptionsFilter());

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  logger.log(`API listening on http://localhost:${port}/api`);
  logger.log(`WebSocket gateway on ws://localhost:${port}/events`);
}

bootstrap().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('Failed to bootstrap application', err);
  process.exit(1);
});
