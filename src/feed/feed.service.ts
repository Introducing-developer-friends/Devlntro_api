import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Post } from '../entities/post.entity';
import { Comment } from '../entities/comment.entity';
import { PostLike } from '../entities/post-like.entity';
import { FeedFilterService } from '../services/feed-filter.service';
import { SortingService } from '../services/sorting-service';
import {
  PostBasicInfo,
  PostDetailInfo,
  CommentInfo,
  LikeInfo,
  SortOption,
  FilterType,
} from '../types/feed.types';
import { ErrorMessageType } from '../enums/error.message.enum';
@Injectable()
export class FeedService {
  private readonly logger = new Logger(FeedService.name);

  constructor(
    private readonly feedFilterService: FeedFilterService,
    private readonly sortingService: SortingService,
    @InjectRepository(Post) private readonly postRepository: Repository<Post>,
  ) {}

  async getFeed(
    userId: number,
    sortOption: SortOption,
    filterType: FilterType,
    specificUserId?: number,
  ): Promise<PostBasicInfo[]> {
    try {
      this.logger.log(
        `Fetching feed for user ${userId} with filter ${filterType}`,
      );

      if (filterType === FilterType.SPECIFIC && !specificUserId) {
        throw new BadRequestException(
          '특정 사용자의 게시물을 조회하기 위해서는 specificUserId가 필요합니다.',
        );
      }

      const posts = await this.feedFilterService.filterPostsByUser(
        userId,
        filterType,
        specificUserId,
      );
      return this.sortingService.sortPosts(posts, sortOption);
    } catch (error) {
      this.logger.error(`Error fetching feed: ${error.message}`);
      throw error;
    }
  }

  async getPostDetail(userId: number, postId: number): Promise<PostDetailInfo> {
    try {
      this.logger.log(`Fetching post detail for post ${postId}`);

      const post = await this.postRepository
        .createQueryBuilder('post')
        .leftJoin('post.user', 'user')
        .leftJoin('post.comments', 'comments', 'comments.deleted_at IS NULL')
        .leftJoin('comments.userAccount', 'commentUser')
        .leftJoin('post.postLikes', 'likes')
        .leftJoin('likes.userAccount', 'likeUser')
        .where('post.post_id = :postId', { postId })
        .andWhere('post.deleted_at IS NULL')
        .select([
          'post.post_id',
          'post.content',
          'post.created_at',
          'post.image_url',
          'post.post_like_count',
          'post.comments_count',
          'user.user_id',
          'user.name',
          'comments.comment_id',
          'comments.content',
          'comments.created_at',
          'comments.like_count',
          'commentUser.user_id',
          'commentUser.name',
          'likes.post_like_id',
          'likes.created_at',
          'likeUser.user_id',
          'likeUser.name',
        ])
        .getOne();

      if (!post) {
        throw new NotFoundException(ErrorMessageType.NOT_FOUND_FEED);
      }

      return this.mapToPostDetailInfo(post, userId);
    } catch (error) {
      this.logger.error(`Error fetching post detail: ${error.message}`);
      throw error;
    }
  }

  private mapToPostDetailInfo(post: Post, userId: number): PostDetailInfo {
    return {
      postId: post.post_id,
      createrId: post.user.user_id,
      createrName: post.user.name,
      createdAt: post.created_at,
      imageUrl: post.image_url,
      content: post.content,
      isOwnPost: post.user.user_id === userId,
      likesCount: post.post_like_count,
      commentsCount: post.comments_count,
      comments: this.mapToCommentInfo(post.comments || []),
      likes: this.mapToLikeInfo(post.postLikes || []),
    };
  }

  private mapToCommentInfo(comments: Comment[]): CommentInfo[] {
    return comments.map((comment) => ({
      commentId: comment.comment_id,
      authorId: comment.userAccount?.user_id,
      authorName: comment.userAccount?.name,
      content: comment.content,
      createdAt: comment.created_at,
      likeCount: comment.like_count,
    }));
  }

  private mapToLikeInfo(likes: PostLike[]): LikeInfo[] {
    return likes.map((like) => ({
      userId: like.userAccount?.user_id,
      userName: like.userAccount?.name,
    }));
  }
}
