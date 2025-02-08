import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthModule } from '../auth/auth.module';
import { FeedModule } from './feed.module';
import { ContactsModule } from '../contacts/contacts.module';
import { Post } from '../entities/post.entity';
import { PostLike } from '../entities/post-like.entity';
import { Comment } from '../entities/comment.entity';
import { BusinessContact } from '../entities/business-contact.entity';
import { UserAccount } from '../entities/user-account.entity';
import { S3Service } from '../s3/s3.service';
import { DataSource } from 'typeorm';
import { PostModule } from '../post/post.module';
import { FeedFilterService } from '../services/feed-filter.service';
import { SortingService } from '../services/sorting-service';

describe('Feed Integration Tests', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let mainUserToken: string;
  let mainUserId: number;
  let mainUserLoginId: string;
  let otherUserToken: string;
  let otherUserId: number;
  const createdPosts: number[] = [];

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
        TypeOrmModule.forFeature([
          Post,
          PostLike,
          Comment,
          BusinessContact,
          UserAccount,
        ]),
        AuthModule,
        FeedModule,
        ContactsModule,
        PostModule,
      ],
      providers: [
        FeedFilterService,
        SortingService,
        {
          provide: S3Service,
          useValue: mockS3Service,
        },
      ],
    }).compile();

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

    mainUserLoginId = `testuser_feed_${Date.now()}`;
    const registerResponse = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        login_id: mainUserLoginId,
        password: 'Test123!@#',
        confirm_password: 'Test123!@#',
        name: 'Test User',
        company: 'Test Company',
        department: 'Test Department',
        position: 'Test Position',
        email: `${mainUserLoginId}@example.com`,
        phone: '010-1234-5678',
      })
      .expect(201);

    mainUserId = registerResponse.body.userId;

    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        login_id: mainUserLoginId,
        password: 'Test123!@#',
      })
      .expect(201);

    mainUserToken = loginResponse.body.accessToken;

    const otherUserLoginId = `testuser_other_${Date.now()}`;
    const otherRegisterResponse = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        login_id: otherUserLoginId,
        password: 'Test123!@#',
        confirm_password: 'Test123!@#',
        name: 'Other User',
        company: 'Test Company',
        department: 'Test Department',
        position: 'Test Position',
        email: `other${Date.now()}@example.com`,
        phone: '010-1111-2222',
      })
      .expect(201);

    otherUserId = otherRegisterResponse.body.userId;

    const otherLoginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        login_id: otherUserLoginId,
        password: 'Test123!@#',
      })
      .expect(201);

    otherUserToken = otherLoginResponse.body.accessToken;

    await dataSource.query(
      `
 INSERT INTO business_contact (user_id, contact_user_id) 
 VALUES (?, ?), (?, ?)
`,
      [mainUserId, mainUserId, mainUserId, otherUserId],
    );

    for (let i = 0; i < 3; i++) {
      const postResponse = await request(app.getHttpServer())
        .post('/posts')
        .set('Authorization', `Bearer ${mainUserToken}`)
        .field('content', `Main user post ${i}`)
        .attach('image', Buffer.from('fake image content'), 'test.jpg')
        .expect(201);

      createdPosts.push(postResponse.body.postId);
    }

    for (let i = 0; i < 2; i++) {
      await request(app.getHttpServer())
        .post('/posts')
        .set('Authorization', `Bearer ${otherUserToken}`)
        .field('content', `Other user post ${i}`)
        .attach('image', Buffer.from('fake image content'), 'test.jpg')
        .expect(201);
    }

    const posts = await dataSource.query(
      'SELECT * FROM post WHERE user_id = ?',
      [mainUserId],
    );
    console.log('Created posts:', posts);

    const contacts = await dataSource.query(
      'SELECT * FROM business_contact WHERE user_id = ? OR contact_user_id = ?',
      [mainUserId, mainUserId],
    );
    console.log('Business contacts:', contacts);
  }, 60000);

  describe('Feed Endpoints', () => {
    describe('GET /posts', () => {
      it('should get feed with default parameters', async () => {
        await request(app.getHttpServer())
          .post('/posts')
          .set('Authorization', `Bearer ${otherUserToken}`)
          .field('content', 'Other user post')
          .attach('image', Buffer.from('fake image content'), 'test.jpg')
          .expect(201);

        const response = await request(app.getHttpServer())
          .get('/posts')
          .set('Authorization', `Bearer ${mainUserToken}`)
          .expect(200);

        expect(response.body.posts).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              createrId: mainUserId,
            }),

            expect.objectContaining({
              createrId: otherUserId,
            }),
          ]),
        );
      });

      it('should get own posts', async () => {
        const response = await request(app.getHttpServer())
          .get('/posts')
          .query({ filter: 'own' })
          .set('Authorization', `Bearer ${mainUserToken}`)
          .expect(200);

        expect(response.body.posts).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              createrId: mainUserId,
            }),
          ]),
        );
      });

      it('should get post detail', async () => {
        const response = await request(app.getHttpServer())
          .get(`/posts/${createdPosts[0]}`)
          .set('Authorization', `Bearer ${mainUserToken}`)
          .expect(200);

        expect(response.body).toEqual({
          statusCode: 200,
          message: '게시물을 성공적으로 조회했습니다.',
          postId: expect.any(Number),
          createrId: mainUserId,
          createrName: expect.any(String),
          createdAt: expect.any(String),
          imageUrl: expect.any(String),
          content: expect.any(String),
          isOwnPost: true,
          likesCount: expect.any(Number),
          commentsCount: expect.any(Number),
          comments: expect.any(Array),
          likes: expect.any(Array),
        });
      });
    });
  });

  afterAll(async () => {
    for (const postId of createdPosts) {
      await request(app.getHttpServer())
        .delete(`/posts/${postId}`)
        .set('Authorization', `Bearer ${mainUserToken}`);
    }

    await dataSource.query(
      'DELETE FROM business_contact WHERE user_id = ? OR contact_user_id = ?',
      [mainUserId, mainUserId],
    );

    await app.close();
  });
});
