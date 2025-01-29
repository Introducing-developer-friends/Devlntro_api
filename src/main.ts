import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { seedInitialData } from './seeds/initial-data.seed';
import { DataSource } from 'typeorm';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin:
      /^(http:\/\/localhost:5173|https:\/\/d2u27gghld24cr\.cloudfront\.net)$/,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  if (process.env.NODE_ENV === 'production') {
    app.setGlobalPrefix('api');
  }

  app.useGlobalPipes(new ValidationPipe());

  app.useGlobalFilters(new HttpExceptionFilter());

  const config = new DocumentBuilder()
    .setTitle('API Documentation')
    .setDescription('API documentation for the project')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  const dataSource = app.get(DataSource);
  await seedInitialData(dataSource);

  await app.listen(3000);
}
bootstrap();
