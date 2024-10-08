import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Post } from '../entities/post.entity';
import { Comment } from '../entities/comment.entity';
import { PostLike } from '../entities/post-like.entity';
import { CommentLike } from '../entities/comment-like.entity'; // 댓글 좋아요 엔티티 추가
import { FeedFilterService } from '../services/feed-filter.service';
import { SortingService } from '../services/sorting-service';
import { SortOption } from '../dto/feed-query.dto';

export class FeedService {
    private readonly logger = new Logger(FeedService.name);
  
    constructor(
      private feedFilterService: FeedFilterService,
      private sortingService: SortingService,
      @InjectRepository(Post) private postRepository: Repository<Post>,
      @InjectRepository(Comment) private commentRepository: Repository<Comment>,
      @InjectRepository(PostLike) private likeRepository: Repository<PostLike>,
      @InjectRepository(CommentLike) private commentLikeRepository: Repository<CommentLike>
    ) {}
    
    /**
   * 사용자의 피드를 조회하고 정렬합니다.
   * @param userId 현재 사용자의 ID
   * @param sortOption 정렬 옵션 (최신순, 좋아요순, 댓글순)
   * @param filterType 필터 타입 (전체, 자신의 게시물, 특정 사용자)
   * @param specificUserId 특정 사용자의 ID (filterType이 'specific'일 때 사용)
   * @returns 정렬된 피드 게시물 목록
   */
    async getFeed(
      userId: number,
      sortOption: SortOption,
      filterType: 'all' | 'own' | 'specific',
      specificUserId?: number
    ) {
      try {

        // 필터링된 게시물 조회
        let posts = await this.feedFilterService.filterPostsByUser(userId, filterType, specificUserId);
        
        // 게시물 정렬
        const sortedPosts = this.sortingService.sortPosts(posts, sortOption);
        
        // 응답 데이터 구성
        return {
          statusCode: 200,
          message: '피드를 성공적으로 조회했습니다.',
          posts: sortedPosts.map((post) => ({
            postId: post.post_id,
            createrId: post.user.user_id,
            createrName: post.user.name,
            createdAt: post.created_at,
            imageUrl: post.image_url,
            isOwnPost: post.user.user_id === userId,
            likesCount: post.post_like_count,
            commentsCount: post.comments_count,
          })),
        };
      } catch (error) {
        this.logger.error(`피드 조회 중 오류 발생: ${error.message}`, error.stack);
        throw error;
      }
    }


  /**
   * 특정 게시물의 상세 정보를 조회합니다.
   * @param userId 현재 사용자의 ID
   * @param postId 조회할 게시물의 ID
   * @returns 게시물 상세 정보
   */
  async getPostDetail(userId: number, postId: number) {
    try {

      // 게시물 조회
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

      if (!post) {
        throw new NotFoundException('해당 게시물을 찾을 수 없습니다.');
      }

      return {
        statusCode: 200,
        message: '게시물을 성공적으로 조회했습니다.',
        postId: post.post_id,
        createrId: post.user.user_id,
        createrName: post.user.name,
        createdAt: post.created_at,
        imageUrl: post.image_url,
        content: post.content,
        likesCount: post.postLikes.length,
        commentsCount: post.comments.length,
        isOwnPost: post.user.user_id === userId,
        comments: post.comments.map((comment) => ({
          commentId: comment.comment_id,
          authorId: comment.userAccount.user_id,
          authorName: comment.userAccount.name,
          content: comment.content,
          createdAt: comment.created_at,
          likeCount: comment.like_count, // 좋아요 수 포함
        })),
        likes: post.postLikes.map((like) => ({
          userId: like.userAccount.user_id,
          userName: like.userAccount.name,
        })),
      };
    } catch (error) {
      this.logger.error(`게시물 상세 조회 중 오류 발생: ${error.message}`, error.stack);
      throw error;
    }
  }
}
