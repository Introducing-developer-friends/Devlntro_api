import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { seedInitialData } from './seeds/initial-data.seed';
import { DataSource } from 'typeorm';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common'; // 유효성 검사 파이프 추가
import { HttpExceptionFilter } from './common/filters/http-exception.filter'; // 전역 에러 필터 추가


async function bootstrap() {
  const app = await NestFactory.create(AppModule);


  // CORS 설정
  app.enableCors({
    origin: /^(http:\/\/localhost:5173|https:\/\/d2kpqep52eiy7y\.cloudfront\.net)$/,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });
  
  // 전역 유효성 검사 파이프 설정
  app.useGlobalPipes(new ValidationPipe());


  // 전역 에러 필터 설정
  app.useGlobalFilters(new HttpExceptionFilter());

  // Swagger 설정 추가
  const config = new DocumentBuilder()
    .setTitle('API Documentation')
    .setDescription('API documentation for the project')
    .setVersion('1.0')
    .addBearerAuth() // JWT 인증 추가
    .build();
  
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  // // 데이터 시드 삽입1
  const dataSource = app.get(DataSource);
  await seedInitialData(dataSource);

  await app.listen(3000);
}
bootstrap();
