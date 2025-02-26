import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MulterModule } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { S3Module } from '../s3/s3.module';
import { PostController } from './controller/post.controller';
import { PostService } from './service/post.service';
import { Post } from './entity/post.entity';
import { PostLike } from './entity/post-like.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Post, PostLike]),
    MulterModule.register({
      storage: memoryStorage(),
      fileFilter: (req, file, cb) => {
        if (file.mimetype.match(/\/(jpg|jpeg|png|gif)$/)) {
          cb(null, true);
        } else {
          cb(new Error('지원되지 않는 파일 형식입니다.'), false);
        }
      },
    }),
    S3Module,
  ],
  controllers: [PostController],
  providers: [PostService],
  exports: [TypeOrmModule],
})
export class PostModule {}
