import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FeedController } from './feed.controller';
import { FeedService } from './feed.service';
import { FeedFilterService } from '../services/feed-filter.service';
import { SortingService } from '../services/sorting-service'; // SortingService 임포트
import { Post } from '../entities/post.entity';
import { BusinessContact } from '../entities/business-contact.entity'; // BusinessContact 엔티티 임포트
import { Comment } from '../entities/comment.entity'; // Comment 엔티티 임포트
import { PostLike } from '../entities/post-like.entity'; // PostLike 엔티티 임포트
import { CommentLike } from '../entities/comment-like.entity';
@Module({
  imports: [TypeOrmModule.forFeature([Post, BusinessContact, Comment, PostLike, CommentLike])], // Post와 BusinessContact 엔티티 등록
  controllers: [FeedController],
  providers: [FeedService, FeedFilterService, SortingService], // FeedFilterService와 SortingService 등록
})
export class FeedModule {}
