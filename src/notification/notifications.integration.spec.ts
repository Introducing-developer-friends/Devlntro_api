import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthModule } from '../auth/auth.module';
import { NotificationsModule } from './notifications.module';
import { DataSource } from 'typeorm';
import { PostModule } from '../post/post.module';
import { S3Service } from '../s3/service/s3.service';

describe('NotificationsService (Integration)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let receiverToken: string;
  let receiverId: number;
  let senderId: number;
  let testPostId: number;
  let receiverLoginId: string;

  const mockS3Service = {
    uploadFile: jest.fn().mockResolvedValue('https://fake-s3-url.com/test.jpg'),
    deleteFile: jest.fn().mockResolvedValue(undefined),
    extractKeyFromUrl: jest.fn().mockReturnValue('test-key'),
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          envFilePath: '.test.env',
          ignoreEnvFile: false,
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
            migrationsRun: false,
          }),
        }),
        AuthModule,
        NotificationsModule,
        PostModule,
      ],
    })
      .overrideProvider(S3Service)
      .useValue(mockS3Service)
      .compile();

    app = moduleFixture.createNestApplication();
    dataSource = moduleFixture.get<DataSource>(DataSource);

    app.useGlobalPipes(
      new ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: true,
      }),
    );

    await app.init();

    receiverLoginId = `receiver_${Date.now()}`;
    const registerResponse = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        login_id: receiverLoginId,
        password: 'Test123!@#',
        confirm_password: 'Test123!@#',
        name: 'Receiver',
        company: 'Test Company',
        department: 'Test Dept',
        position: 'Test Position',
        email: 'receiver@test.com',
        phone: '010-1111-2222',
      });

    receiverId = registerResponse.body.userId;

    const senderLoginId = `sender_${Date.now()}`;
    const senderResponse = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        login_id: senderLoginId,
        password: 'Test123!@#',
        confirm_password: 'Test123!@#',
        name: 'Sender',
        company: 'Test Company',
        department: 'Test Dept',
        position: 'Test Position',
        email: 'sender@test.com',
        phone: '010-3333-4444',
      });

    senderId = senderResponse.body.userId;

    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        login_id: receiverLoginId,
        password: 'Test123!@#',
      });

    receiverToken = loginResponse.body.accessToken;
    console.log('receiverToken:', receiverToken);

    const postResponse = await request(app.getHttpServer())
      .post('/posts')
      .set('Authorization', `Bearer ${receiverToken}`)
      .field('content', 'Test post content')
      .attach('image', Buffer.from('fake image content'), 'test.jpg');

    testPostId = postResponse.body.postId;
    console.log('게시물 생성 응답:', postResponse.body);
  });

  describe('알림 CRUD 테스트', () => {
    let notificationId: number;

    it('친구 요청 알림 생성', async () => {
      await dataSource.query(
        `INSERT INTO friend_request (sender_id, receiver_id, status) VALUES (?, ?, ?)`,
        [senderId, receiverId, 'pending'],
      );

      const notification = await dataSource.query(
        `INSERT INTO notification 
         (sender_id, receiver_id, type, message) 
         VALUES (?, ?, ?, ?)`,
        [senderId, receiverId, 'FRIEND_REQUEST', '친구 요청이 도착했습니다.'],
      );

      notificationId = notification.insertId;
      expect(notificationId).toBeDefined();
    });

    it('게시물 좋아요 알림 생성', async () => {
      await dataSource.query(
        `INSERT INTO post_like (post_id, user_id) VALUES (?, ?)`,
        [testPostId, senderId],
      );

      const notification = await dataSource.query(
        `INSERT INTO notification 
         (sender_id, receiver_id, type, message, post_id) 
         VALUES (?, ?, ?, ?, ?)`,
        [
          senderId,
          receiverId,
          'LIKE_POST',
          '게시물에 좋아요를 눌렀습니다.',
          testPostId,
        ],
      );

      expect(notification.insertId).toBeDefined();
    });

    it('알림 목록 조회', async () => {
      const response = await request(app.getHttpServer())
        .get('/notifications')
        .set('Authorization', `Bearer ${receiverToken}`);

      console.log('알림 목록 조회 응답:', response.body);
      expect(response.status).toBe(200);
      expect(response.body.notifications.length).toBeGreaterThan(0);
    });

    it('알림 읽음 처리', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/notifications/${notificationId}/read`)
        .set('Authorization', `Bearer ${receiverToken}`);

      expect(response.status).toBe(200);

      const [notification] = await dataSource.query(
        'SELECT is_read FROM notification WHERE notification_id = ?',
        [notificationId],
      );
      expect(notification.is_read).toBe(1);
    });
  });

  afterAll(async () => {
    try {
      await dataSource.query(
        'DELETE FROM notification WHERE receiver_id IN (?, ?)',
        [receiverId, senderId],
      );
      await dataSource.query('DELETE FROM post_like WHERE post_id = ?', [
        testPostId,
      ]);
      await dataSource.query('DELETE FROM comment WHERE post_id = ?', [
        testPostId,
      ]);
      await dataSource.query('DELETE FROM post WHERE user_id IN (?, ?)', [
        receiverId,
        senderId,
      ]);
      await dataSource.query(
        'DELETE FROM friend_request WHERE sender_id IN (?, ?) OR receiver_id IN (?, ?)',
        [senderId, receiverId, senderId, receiverId],
      );
      await dataSource.query(
        'DELETE FROM refresh_token WHERE user_id IN (?, ?)',
        [receiverId, senderId],
      );
      await dataSource.query(
        'DELETE FROM business_profile WHERE user_id IN (?, ?)',
        [receiverId, senderId],
      );
      await dataSource.query(
        'DELETE FROM user_account WHERE user_id IN (?, ?)',
        [receiverId, senderId],
      );
    } catch (error) {
      console.error('Cleanup error:', error);
    }
    await app.close();
  });
});
