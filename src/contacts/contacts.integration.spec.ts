import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthModule } from '../auth/auth.module';
import { ContactsModule } from './contacts.module';
import { BusinessContact } from '../entities/business-contact.entity';
import { UserAccount } from '../entities/user-account.entity';
import { FriendRequest } from '../entities/friend-request.entity';

describe('Contacts Integration Tests', () => {
  let app: INestApplication;
  let user1Token: string;
  let user2Token: string;
  let user1Id: string;
  let user2Id: string;
  let user2UserId: number;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          envFilePath: '.test.env',
          isGlobal: true,
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
          }),
        }),
        TypeOrmModule.forFeature([BusinessContact, UserAccount, FriendRequest]),
        AuthModule,
        ContactsModule,
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

    user1Id = 'testuser1';
    await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        login_id: user1Id,
        password: 'Test123!@#',
        confirm_password: 'Test123!@#',
        name: 'Test User 1',
        company: 'Test Company',
        department: 'Test Department',
        position: 'Test Position',
        email: `${user1Id}@example.com`,
        phone: '010-1234-5678',
      });

    const loginResponse1 = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        login_id: user1Id,
        password: 'Test123!@#',
      });
    user1Token = loginResponse1.body.accessToken;

    user2Id = `testuser2_${Date.now()}`;
    const registerResponse = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        login_id: user2Id,
        password: 'Test123!@#',
        confirm_password: 'Test123!@#',
        name: 'Test User 2',
        company: 'Test Company 2',
        department: 'Test Department 2',
        position: 'Test Position 2',
        email: `${user2Id}@example.com`,
        phone: '010-2345-6789',
      });
    user2UserId = registerResponse.body.userId;

    const loginResponse2 = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        login_id: user2Id,
        password: 'Test123!@#',
      });
    user2Token = loginResponse2.body.accessToken;
  }, 30000);

  describe('Contact Management', () => {
    describe('Contact Requests', () => {
      let requestId: number;

      it('should send contact request', async () => {
        const response = await request(app.getHttpServer())
          .post('/contacts')
          .set('Authorization', `Bearer ${user1Token}`)
          .send({ login_id: user2Id })
          .expect(201);

        expect(response.body).toEqual({
          statusCode: 201,
          message: '인맥 요청이 성공적으로 추가되었습니다.',
          requestId: expect.any(Number),
        });

        requestId = response.body.requestId;
      });

      it('should get received requests', async () => {
        const response = await request(app.getHttpServer())
          .get('/contacts/requests/received')
          .set('Authorization', `Bearer ${user2Token}`)
          .expect(200);

        expect(response.body.requests).toContainEqual({
          requestId: expect.any(Number),
          senderLoginId: user1Id,
          senderName: 'Test User 1',
          requestedAt: expect.any(String),
        });
      });

      it('should get sent requests', async () => {
        const response = await request(app.getHttpServer())
          .get('/contacts/requests/sent')
          .set('Authorization', `Bearer ${user1Token}`)
          .expect(200);

        expect(response.body.requests).toContainEqual({
          requestId: expect.any(Number),
          receiverLoginId: user2Id,
          receiverName: 'Test User 2',
          requestedAt: expect.any(String),
        });
      });

      it('should accept contact request', async () => {
        const response = await request(app.getHttpServer())
          .post(`/contacts/accept/${requestId}`)
          .set('Authorization', `Bearer ${user2Token}`)
          .expect(201);

        expect(response.body).toEqual({
          statusCode: 200,
          message: '인맥 요청이 수락되었습니다.',
        });
      });
    });

    describe('Contact List and Details', () => {
      beforeEach(async () => {
        const requestResponse = await request(app.getHttpServer())
          .post('/contacts')
          .set('Authorization', `Bearer ${user1Token}`)
          .send({ login_id: user2Id });

        await request(app.getHttpServer())
          .post(`/contacts/accept/${requestResponse.body.requestId}`)
          .set('Authorization', `Bearer ${user2Token}`)
          .expect(201);
      });

      it('should get contact list', async () => {
        const response = await request(app.getHttpServer())
          .get('/contacts')
          .set('Authorization', `Bearer ${user1Token}`)
          .expect(200);

        expect(response.body.contacts).toContainEqual({
          userId: expect.any(Number),
          name: 'Test User 2',
          company: 'Test Company 2',
          department: 'Test Department 2',
        });
      });

      it('should get contact detail', async () => {
        const response = await request(app.getHttpServer())
          .get(`/contacts/${user2UserId}`)
          .set('Authorization', `Bearer ${user1Token}`)
          .expect(200);

        expect(response.body).toEqual({
          statusCode: 200,
          message: '명함 상세 정보를 성공적으로 조회했습니다.',
          contact: {
            userId: expect.any(Number),
            name: 'Test User 2',
            company: 'Test Company 2',
            department: 'Test Department 2',
            position: 'Test Position 2',
            email: `${user2Id}@example.com`,
            phone: '010-2345-6789',
          },
        });
      });
    });

    describe('Contact Deletion', () => {
      beforeEach(async () => {
        const requestResponse = await request(app.getHttpServer())
          .post('/contacts')
          .set('Authorization', `Bearer ${user1Token}`)
          .send({ login_id: user2Id });

        await request(app.getHttpServer())
          .post(`/contacts/accept/${requestResponse.body.requestId}`)
          .set('Authorization', `Bearer ${user2Token}`)
          .expect(201);
      });

      it('should delete contact', async () => {
        const contactList = await request(app.getHttpServer())
          .get('/contacts')
          .set('Authorization', `Bearer ${user1Token}`)
          .expect(200);

        const targetContact = contactList.body.contacts.find(
          (contact) => Number(contact.userId) === Number(user2UserId),
        );
        expect(targetContact).toBeDefined();

        const response = await request(app.getHttpServer())
          .delete(`/contacts/${targetContact.userId}`)
          .set('Authorization', `Bearer ${user1Token}`)
          .expect(200);

        expect(response.body).toEqual({
          statusCode: 200,
          message: '인맥이 성공적으로 삭제되었습니다.',
        });

        const afterDeleteContactList = await request(app.getHttpServer())
          .get('/contacts')
          .set('Authorization', `Bearer ${user1Token}`)
          .expect(200);

        const deletedContact = afterDeleteContactList.body.contacts.find(
          (contact) => Number(contact.userId) === Number(user2UserId),
        );
        expect(deletedContact).toBeUndefined();
      });
    });
  });

  afterAll(async () => {
    await app.close();
  });
});
