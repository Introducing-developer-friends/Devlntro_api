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
export class FeedService {
    private readonly logger = new Logger(FeedService.name);
  
    constructor(
      private readonly  feedFilterService: FeedFilterService,
      private readonly  sortingService: SortingService,
      @InjectRepository(Post) private readonly  postRepository: Repository<Post>,
      @InjectRepository(Comment) private readonly  commentRepository: Repository<Comment>,
      @InjectRepository(PostLike) private readonly  likeRepository: Repository<PostLike>,
      @InjectRepository(CommentLike) private readonly  commentLikeRepository: Repository<CommentLike>
    ) {}
    
    // 피드를 가져오는 메서드
    async getFeed(
      userId: number,
      sortOption: SortOption,
      filterType: FilterType,
      specificUserId?: number
    ): Promise<PostBasicInfo[]> {
      this.logger.log(`Fetching feed for user ${userId}`);
      
      // 특정 유저의 게시물 필터링이 요청되었지만 특정 유저 ID가 없을 경우 예외 처리
      if (filterType === FilterType.SPECIFIC && !specificUserId) {
        throw new BadRequestException('잘못된 요청입니다. specificUserId가 필요합니다.');
      }
      
      // FeedFilterService를 사용하여 게시물 필터링
      const posts = await this.feedFilterService.filterPostsByUser(userId, filterType, specificUserId);
      
      // SortingService를 사용하여 게시물 정렬
      const sortedPosts = this.sortingService.sortPosts(posts, sortOption);
      
      // 정렬된 게시물들을 PostBasicInfo 형태로 변환하여 반환
      return sortedPosts.map(post => this.mapToPostBasicInfo(post, userId));
    }

    // 게시물 상세 정보를 가져오는 메서드
    async getPostDetail(userId: number, postId: number): Promise<PostDetailInfo> {
      this.logger.log(`Fetching post detail for post ${postId}`);
  
      const post = await this.postRepository.createQueryBuilder('post')
        .leftJoinAndSelect('post.user', 'user')
        .leftJoinAndSelect('post.comments', 'comments')
        .leftJoinAndSelect('comments.userAccount', 'commentUser')
        .leftJoinAndSelect('post.postLikes', 'likes')
        .leftJoinAndSelect('likes.userAccount', 'likeUser')
        .where('post.post_id = :postId', { postId })
        .select([
          'post',
          'user.user_id', 'user.name',
          'comments', 'commentUser.user_id', 'commentUser.name',
          'likes', 'likeUser.user_id', 'likeUser.name'
        ])
        .getOne();
        
        // 게시물 상세 정보를 PostDetailInfo로 변환하여 반환
        return {
          ...this.mapToPostBasicInfo(post, userId),
          content: post.content,
          comments: this.mapToCommentInfo(post.comments),
          likes: this.mapToLikeInfo(post.postLikes)
        };
      }
      
      // 게시물의 기본 정보를 PostBasicInfo 타입으로 변환하는 메서드
      private mapToPostBasicInfo(post: Post, userId: number): PostBasicInfo {
        return {
          postId: post.post_id,
          createrId: post.user.user_id,
          createrName: post.user.name,
          createdAt: post.created_at,
          imageUrl: post.image_url,
          isOwnPost: post.user.user_id === userId,
          likesCount: post.post_like_count,
          commentsCount: post.comments_count,
        };
      }
      
      // 댓글 목록을 CommentInfo 타입으로 변환하는 메서드
      private mapToCommentInfo(comments: Comment[]): CommentInfo[] {
        return comments.map(comment => ({
          commentId: comment.comment_id,
          authorId: comment.userAccount.user_id,
          authorName: comment.userAccount.name,
          content: comment.content,
          createdAt: comment.created_at,
          likeCount: comment.like_count,
        }));
      }
      
       // 좋아요 목록을 LikeInfo 타입으로 변환하는 메서드
      private mapToLikeInfo(likes: PostLike[]): LikeInfo[] {
        return likes.map(like => ({
          userId: like.userAccount.user_id,
          userName: like.userAccount.name,
        }));
      }
    }
