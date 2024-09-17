import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { seedInitialData } from './seeds/initial-data.seed';
import { DataSource } from 'typeorm';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { JwtAuthGuard } from './auth/jwt-auth.guard';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 전역으로 JWT 인증 가드 설정
  app.useGlobalGuards(new JwtAuthGuard());

  // Swagger 설정 추가
  const config = new DocumentBuilder()
    .setTitle('API Documentation')
    .setDescription('API documentation for the project')
    .setVersion('1.0')
    .addBearerAuth() // JWT 인증 추가, 필요시 제거 가능
    .build();
  
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document);

  // 데이터 시드 삽입
  const dataSource = app.get(DataSource);
  await seedInitialData(dataSource);

  await app.listen(3000);
}
bootstrap();
