// src/user/__tests__/user.integration.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { UserModule } from './user.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthModule } from '../auth/auth.module';

describe('User Integration Tests', () => {
  let app: INestApplication;
  let authToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          envFilePath: '.test.env',
        }),
        TypeOrmModule.forRootAsync({
          imports: [ConfigModule],
          inject: [ConfigService],
          useFactory: (configService: ConfigService) => ({
            type: 'mysql',
            host: configService.get('DB_HOST'),
            port: configService.get('DB_PORT'),
            username: configService.get('DB_USERNAME'),
            password: configService.get('DB_PASSWORD'),
            database: configService.get('DB_DATABASE'),
            entities: [__dirname + '/../../**/*.entity{.ts,.js}'],
            synchronize: false,
            migrationsRun: true,
          }),
        }),
        AuthModule,
        UserModule,
      ],
    }).compile();

    app = moduleFixture.createNestApplication();

    app.useGlobalPipes(
      new ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: true,
      }),
    );
    await app.init();

    const randomId = `testuser_${Date.now()}`;
    await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        login_id: randomId,
        password: 'Test123!@#',
        confirm_password: 'Test123!@#',
        name: 'Test User',
        company: 'Test Company',
        department: 'Test Department',
        position: 'Test Position',
        email: `${randomId}@example.com`,
        phone: '010-1234-5678',
      });

    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        login_id: randomId,
        password: 'Test123!@#',
      });

    authToken = loginResponse.body.accessToken;
  }, 30000);

  describe('/users/businessprofile (PUT)', () => {
    it('should update business profile successfully', () => {
      return request(app.getHttpServer())
        .put('/users/businessprofile')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Test User',
          company: 'Test Company',
          department: 'IT',
          position: 'Developer',
          email: 'test.user@example.com',
          phone: '010-1234-5678',
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.statusCode).toBe(200);
          expect(res.body.message).toBe(
            '프로필 정보가 성공적으로 수정되었습니다.',
          );
          expect(res.body.profile).toEqual(
            expect.objectContaining({
              company: 'Test Company',
              department: 'IT',
              position: 'Developer',
              email: 'test.user@example.com',
              phone: '010-1234-5678',
            }),
          );
        });
    });

    it('should handle invalid profile data', () => {
      return request(app.getHttpServer())
        .put('/users/businessprofile')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 123,
          company: true,
        })
        .expect(400);
    });
  });

  describe('/users/password (PUT)', () => {
    it('should change password successfully', () => {
      return request(app.getHttpServer())
        .put('/users/password')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          currentPassword: 'Test123!@#',
          newPassword: 'NewTest123!@#',
          confirmNewPassword: 'NewTest123!@#',
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.message).toBe(
            '비밀번호가 성공적으로 변경되었습니다.',
          );
        });
    });

    it('should fail with wrong current password', () => {
      return request(app.getHttpServer())
        .put('/users/password')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          currentPassword: 'WrongPassword123!',
          newPassword: 'NewTest123!@#',
          confirmNewPassword: 'NewTest123!@#',
        })
        .expect(401)
        .expect((res) => {
          expect(res.body.message).toBe('비밀번호가 올바르지 않습니다.');
        });
    });

    it('should fail when new passwords do not match', () => {
      return request(app.getHttpServer())
        .put('/users/password')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          currentPassword: 'Test123!@#',
          newPassword: 'NewTest123!@#',
          confirmNewPassword: 'DifferentPassword123!',
        })
        .expect(400)
        .expect((res) => {
          expect(res.body.message).toBe(
            '새 비밀번호와 확인 비밀번호가 일치하지 않습니다.',
          );
        });
    });
  });

  describe('/users (DELETE)', () => {
    it('should delete account successfully', () => {
      return request(app.getHttpServer())
        .delete('/users')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          password: 'NewTest123!@#',
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.message).toBe(
            '회원 탈퇴가 성공적으로 처리되었습니다.',
          );
        });
    });
  });

  afterAll(async () => {
    await app.close();
  });
});
