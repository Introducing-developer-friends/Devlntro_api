import { Injectable, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Post } from '../entities/post.entity';  // Post 엔티티 직접 사용
import { Comment } from '../entities/comment.entity';  // Comment 엔티티 사용
import { PostLike } from '../entities/post-like.entity';  // Like 엔티티 사용
import { FeedFilterService } from '../services/feed-filter.service';
import { SortingService } from '../services/sorting-service';
import { SortOption } from '../dto/feed-query.dto';

@Injectable()
export class FeedService {
  constructor(
    private feedFilterService: FeedFilterService,  // 피드 필터링 서비스 사용
    private sortingService: SortingService,  // 정렬 서비스 사용
    @InjectRepository(Post) private postRepository: Repository<Post>,  // Post 레포지토리 주입
    @InjectRepository(Comment) private commentRepository: Repository<Comment>,  // Comment 레포지토리 주입
    @InjectRepository(PostLike) private likeRepository: Repository<PostLike>  // Like 레포지토리 주입
  ) {}

  /**
   * 피드 조회: 필터링된 게시물에 정렬 옵션을 적용
   * @param userId - 현재 유저 ID
   * @param sortOption - 정렬 기준 ('latest', 'likes', 'comments')
   * @param filterType - 필터링 기준 ('all', 'own', 'specific')
   * @param specificUserId - 특정 유저의 게시물만 조회할 때 사용하는 유저 ID (선택적)
   * @returns 정렬된 게시물 리스트
   */
  async getFeed(userId: number, sortOption: SortOption, filterType: 'all' | 'own' | 'specific', specificUserId?: number) {
    // FeedFilterService 사용하여 필터링
    const posts = await this.feedFilterService.filterPostsByUser(userId, filterType, specificUserId);

    // SortingService 사용하여 정렬
    const sortedPosts = this.sortingService.sortPosts(posts, sortOption);

    // 반환 데이터 구조
    return {
      statusCode: 200,
      message: '피드를 성공적으로 조회했습니다.',
      posts: sortedPosts.map(post => ({
        postId: post.postId,
        createrId: post.user.userId,
        createrName: post.user.name,
        createdAt: post.createdAt,
        imageUrl: post.imageUrl,
        isOwnPost: post.user.userId === userId,  // 본인 게시물 여부 확인
      }))
    };
  }

  /**
   * 게시물 상세 조회
   * @param userId - 현재 유저 ID
   * @param postId - 조회할 게시물 ID
   * @returns 게시물 상세 정보
   */
  async getPostDetail(userId: number, postId: number) {
    // postId로 게시물 조회
    const post = await this.postRepository.findOne({
      where: { post_id: postId },
      relations: ['user'],  // 작성자 정보 포함
    });

    if (!post) {
      throw new NotFoundException('해당 게시물을 찾을 수 없습니다.');
    }

    // 댓글과 좋아요 정보 조회
    const comments = await this.commentRepository.find({
      where: { post: { post_id: postId } },
      relations: ['user'],
      order: { created_at: 'DESC' },
    });

    const likes = await this.likeRepository.find({
      where: { post: { post_id: postId } },
      relations: ['user'],
    });

    // 상세 정보 반환
    return {
      statusCode: 200,
      message: '게시물을 성공적으로 조회했습니다.',
      postId: post.post_id,
      createrId: post.user.user_id,
      createrName: post.user.name,
      createdAt: post.created_at,
      imageUrl: post.image_url,
      content: post.content,
      likesCount: likes.length,
      commentsCount: comments.length,
      isOwnPost: post.user.user_id === userId,  // 본인 게시물 여부 확인
      comments: comments.map(comment => ({
        commentId: comment.comment_id,
        authorName: comment.userAccount.name,
        content: comment.content,
        createdAt: comment.created_at,
      })),
      likes: likes.map(like => ({
        userId: like.userAccount.user_id,
        userName: like.userAccount.name,
      }))
    };
  }
}
