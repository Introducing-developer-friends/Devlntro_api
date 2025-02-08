import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FeedController } from './feed.controller';
import { FeedService } from './feed.service';
import { FeedFilterService } from '../services/feed-filter.service';
import { SortingService } from '../services/sorting-service';
import { Post } from '../entities/post.entity';
import { BusinessContact } from '../entities/business-contact.entity';
import { Comment } from '../entities/comment.entity';
import { PostLike } from '../entities/post-like.entity';
import { CommentLike } from '../entities/comment-like.entity';
@Module({
  imports: [
    TypeOrmModule.forFeature([
      Post,
      BusinessContact,
      Comment,
      PostLike,
      CommentLike,
    ]),
  ],
  controllers: [FeedController],
  providers: [FeedService, FeedFilterService, SortingService],
})
export class FeedModule {}
