import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { seedInitialData } from './seeds/initial-data.seed';
import { DataSource } from 'typeorm';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const dataSource = app.get(DataSource);
  await seedInitialData(dataSource);
  await app.listen(3000);
}
bootstrap();