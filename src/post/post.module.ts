import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MulterModule } from '@nestjs/platform-express';
import { PostController } from './post.controller';
import { PostService } from './post.service';
import { Post } from '../entities/post.entity';
import { PostLike } from '../entities/post-like.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Post, PostLike]), // TypeORM 엔티티 등록
    MulterModule.register({
      dest: './uploads', // 파일 업로드 경로 설정
    }),
  ],
  controllers: [PostController],
  providers: [PostService],
})
export class PostModule {}