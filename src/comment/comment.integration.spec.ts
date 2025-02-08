import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthModule } from '../auth/auth.module';
import { CommentModule } from './comment.module';
import { PostModule } from '../post/post.module';
import { Comment } from '../entities/comment.entity';
import { CommentLike } from '../entities/comment-like.entity';
import { Post } from '../entities/post.entity';
import { UserAccount } from '../entities/user-account.entity';

describe('Comments Integration Tests', () => {
  let app: INestApplication;
  let authToken: string;
  let postId: number;

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
        TypeOrmModule.forFeature([Comment, CommentLike, Post, UserAccount]),
        AuthModule,
        PostModule,
        CommentModule,
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

    const createPostResponse = await request(app.getHttpServer())
      .post('/posts')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        content: 'Test post content',
      });
    postId = createPostResponse.body.postId;
  }, 30000);

  describe('Comment Management', () => {
    let commentId: number;

    it('should create a comment', async () => {
      const response = await request(app.getHttpServer())
        .post(`/posts/${postId}/comments`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          content: '테스트 댓글입니다.',
        });

      expect(response.status).toBe(201);
      expect(response.body).toEqual({
        statusCode: 201,
        message: '댓글이 성공적으로 작성되었습니다.',
        commentId: expect.any(Number),
      });

      commentId = response.body.commentId;
    });

    it('should update a comment', async () => {
      const response = await request(app.getHttpServer())
        .put(`/posts/${postId}/comments/${commentId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          content: '수정된 테스트 댓글입니다.',
        });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        statusCode: 200,
        message: '댓글이 성공적으로 수정되었습니다.',
      });
    });

    it('should delete a comment', async () => {
      const response = await request(app.getHttpServer())
        .delete(`/posts/${postId}/comments/${commentId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        statusCode: 200,
        message: '댓글이 성공적으로 삭제되었습니다.',
      });
    });

    it('should not find deleted comment', async () => {
      const response = await request(app.getHttpServer())
        .get(`/posts/${postId}/comments/${commentId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
    });

    it('should return 401 without auth token', async () => {
      await request(app.getHttpServer())
        .post(`/posts/${postId}/comments`)
        .send({
          content: '인증 없는 댓글 테스트',
        })
        .expect(401);
    });
  });

  afterAll(async () => {
    await app.close();
  });
});
