import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FeedController } from './controller/feed.controller';
import { FeedService } from './service/feed.service';
import { FeedFilterService } from '../services/feed-filter.service';
import { SortingService } from '../services/sorting-service';
import { Post } from '../post/entity/post.entity';
import { BusinessContact } from '../contacts/entity/business-contact.entity';
import { Comment } from '../comment/entity/comment.entity';
import { PostLike } from '../post/entity/post-like.entity';
import { CommentLike } from '../comment/entity/comment-like.entity';
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
