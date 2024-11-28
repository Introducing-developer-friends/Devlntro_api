import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Post } from '../entities/post.entity';
import { Comment } from '../entities/comment.entity';
import { PostLike } from '../entities/post-like.entity';
import { CommentLike } from '../entities/comment-like.entity'; // 댓글 좋아요 엔티티 추가
import { FeedFilterService } from '../services/feed-filter.service';
import { SortingService } from '../services/sorting-service';
import { 
  PostBasicInfo, 
  PostDetailInfo, 
  CommentInfo,
  LikeInfo,
  SortOption,
  FilterType 
} from '../types/feed.types';
@Injectable()
export class FeedService {
  private readonly logger = new Logger(FeedService.name);

  constructor(
    private readonly feedFilterService: FeedFilterService,
    private readonly sortingService: SortingService,
    @InjectRepository(Post) private readonly postRepository: Repository<Post>,
    @InjectRepository(Comment) private readonly commentRepository: Repository<Comment>,
    @InjectRepository(PostLike) private readonly likeRepository: Repository<PostLike>,
    @InjectRepository(CommentLike) private readonly commentLikeRepository: Repository<CommentLike>
  ) {}

  // 피드 조회 메서드
  async getFeed(
    userId: number,
    sortOption: SortOption,
    filterType: FilterType,
    specificUserId?: number
  ): Promise<PostBasicInfo[]> {
    try {
      this.logger.log(`Fetching feed for user ${userId} with filter ${filterType}`);

      // SPECIFIC 필터 타입일 때 specificUserId가 없으면 예외 발생
      if (filterType === FilterType.SPECIFIC && !specificUserId) {
        throw new BadRequestException('특정 사용자의 게시물을 조회하기 위해서는 specificUserId가 필요합니다.');
      }

      // 필터링된 게시물 조회 후 정렬하여 반환
      const posts = await this.feedFilterService.filterPostsByUser(userId, filterType, specificUserId);
      return this.sortingService.sortPosts(posts, sortOption);

    } catch (error) {
      this.logger.error(`Error fetching feed: ${error.message}`);
      throw error;
    }
  }

  // 게시물 상세 정보 조회 메서드
  async getPostDetail(userId: number, postId: number): Promise<PostDetailInfo> {
    try {
      this.logger.log(`Fetching post detail for post ${postId}`);

      // 게시물과 연관된 데이터를 한 번의 쿼리로 조회
      const post = await this.postRepository.createQueryBuilder('post')
        .leftJoin('post.user', 'user')
        .leftJoin('post.comments', 'comments', 'comments.deleted_at IS NULL')
        .leftJoin('comments.userAccount', 'commentUser')
        .leftJoin('post.postLikes', 'likes')
        .leftJoin('likes.userAccount', 'likeUser')
        .where('post.post_id = :postId', { postId })
        .andWhere('post.deleted_at IS NULL')
        .select([
          // 필요한 필드만 선택하여 조회
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
          'likeUser.name'
        ])
        .getOne();

      // 게시물이 없으면 예외 발생
      if (!post) {
        throw new NotFoundException('해당 게시물을 찾을 수 없습니다.');
      }

      return this.mapToPostDetailInfo(post, userId);
    } catch (error) {
      this.logger.error(`Error fetching post detail: ${error.message}`);
      throw error;
    }
  }

  // 게시물 상세 정보를 클라이언트 응답 형식으로 변환하는 private 메서드
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
      likes: this.mapToLikeInfo(post.postLikes || [])
    };
  }

  // 댓글 정보를 클라이언트 응답 형식으로 변환하는 private 메서드
  private mapToCommentInfo(comments: Comment[]): CommentInfo[] {
    return comments.map(comment => ({
      commentId: comment.comment_id,
      authorId: comment.userAccount?.user_id,
      authorName: comment.userAccount?.name,
      content: comment.content,
      createdAt: comment.created_at,
      likeCount: comment.like_count,
    }));
  }

  // 좋아요 정보를 클라이언트 응답 형식으로 변환하는 private 메서드
  private mapToLikeInfo(likes: PostLike[]): LikeInfo[] {
    return likes.map(like => ({
      userId: like.userAccount?.user_id,
      userName: like.userAccount?.name,
    }));
  }
}
