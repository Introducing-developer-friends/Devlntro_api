// src/user/__tests__/user.integration.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthModule } from '../auth/auth.module';
import { PostModule } from './post.module';
import { S3Service } from '../s3/s3.service';
import { Post } from '../entities/post.entity';
import { PostLike } from '../entities/post-like.entity';

describe('User Integration Tests', () => {
  let app: INestApplication;
  let authToken: string;

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
        TypeOrmModule.forFeature([Post, PostLike]),
        AuthModule,
        PostModule,
      ],
    })
      .overrideProvider(S3Service)
      .useValue(mockS3Service)
      .compile();

    app = moduleFixture.createNestApplication();

    app.useGlobalPipes(
      new ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: true,
      }),
    );
    await app.init();

    const randomId = `testuser_fixed`;
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
  describe('Post CRUD and Features', () => {
    let createdPostId: number;

    beforeEach(async () => {
      const createResponse = await request(app.getHttpServer())
        .post('/posts')
        .set('Authorization', `Bearer ${authToken}`)
        .field('content', 'aslkdjaskljasklasjkasjlkda')
        .attach('image', Buffer.from('fake image content'), 'test.jpg')
        .expect(201);

      createdPostId = createResponse.body.postId;
    });

    describe('Create Post', () => {
      it('should create post with text only', async () => {
        const response = await request(app.getHttpServer())
          .post('/posts')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            content: 'Test post content',
          })
          .expect(201);

        expect(response.body).toEqual({
          statusCode: 201,
          message: '게시물이 성공적으로 작성되었습니다.',
          postId: expect.any(Number),
          imageUrl: null,
        });
      });

      it('should create post with image', async () => {
        const response = await request(app.getHttpServer())
          .post('/posts')
          .set('Authorization', `Bearer ${authToken}`)
          .field('content', 'Test post content')
          .attach('image', Buffer.from('fake image content'), 'test.jpg')
          .expect(201);

        expect(response.body).toEqual({
          statusCode: 201,
          message: '게시물이 성공적으로 작성되었습니다.',
          postId: expect.any(Number),
          imageUrl: 'https://fake-s3-url.com/test.jpg',
        });
      });
    });

    describe('Update Post', () => {
      it('should update post with image', async () => {
        const updateResponse = await request(app.getHttpServer())
          .put(`/posts/${createdPostId}`)
          .set('Authorization', `Bearer ${authToken}`)
          .field('content', 'Updated with image')
          .attach('image', Buffer.from('fake image content'), 'test.jpg');

        expect(updateResponse.status).toBe(200);
        expect(updateResponse.body.message).toBe(
          '게시물이 성공적으로 수정되었습니다.',
        );
      });
    });

    describe('Delete Post', () => {
      it('should delete post', async () => {
        const deleteResponse = await request(app.getHttpServer())
          .delete(`/posts/${createdPostId}`)
          .set('Authorization', `Bearer ${authToken}`)
          .field('content', 'Delete with image')
          .attach('image', Buffer.from('fake image content'), 'test.jpg');

        expect(deleteResponse.status).toBe(200);
        expect(deleteResponse.body.message).toBe(
          '게시물이 성공적으로 삭제되었습니다.',
        );
      });
    });

    describe('Post Likes', () => {
      it('should like and unlike post', async () => {
        const likeResponse = await request(app.getHttpServer())
          .post(`/posts/${createdPostId}/like`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(201);

        expect(likeResponse.body).toEqual({
          statusCode: 200,
          message: '게시물에 좋아요를 눌렀습니다.',
          likeCount: expect.any(Number),
        });

        const unlikeResponse = await request(app.getHttpServer())
          .post(`/posts/${createdPostId}/like`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(201);

        expect(unlikeResponse.body).toEqual({
          statusCode: 200,
          message: '게시물 좋아요를 취소했습니다.',
          likeCount: expect.any(Number),
        });
      });
    });
  });

  afterAll(async () => {
    await app.close();
  });
});
