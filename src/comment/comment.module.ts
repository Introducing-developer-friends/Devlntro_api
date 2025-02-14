import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommentController } from './comment.controller';
import { CommentService } from './comment.service';
import { Comment } from './entity/comment.entity';
import { CommentLike } from './entity/comment-like.entity';
import { PostModule } from '../post/post.module';

@Module({
  imports: [TypeOrmModule.forFeature([Comment, CommentLike]), PostModule],
  controllers: [CommentController],
  providers: [CommentService],
})
export class CommentModule {}
