import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Comment } from '../entities/comment.entity';
import { CommentLike } from '../entities/comment-like.entity';
import { Post } from '../entities/post.entity';
import { CreateCommentDto, UpdateCommentDto } from './dto/comment.dto';
import {
  CommentCreateResult,
  CommentUpdateResult,
  CommentDeleteResult,
  CommentLikeResult,
} from '../types/comment.types';
@Injectable()
export class CommentService {
  constructor(
    @InjectRepository(Comment)
    private readonly commentRepository: Repository<Comment>, // Comment 엔티티를 위한 TypeORM 리포지토리 주입
    @InjectRepository(CommentLike)
    private readonly commentLikeRepository: Repository<CommentLike>, // CommentLike 엔티티를 위한 TypeORM 리포지토리 주입
    @InjectRepository(Post)
    private readonly postRepository: Repository<Post>,
  ) {}

  // 댓글 생성 메서드
  async createComment(
    userId: number,
    postId: number,
    createCommentDto: CreateCommentDto,
  ): Promise<CommentCreateResult> {
    // 게시물 존재 확인 및 댓글 수 확인
    const [post, currentCount] = await Promise.all([
      this.postRepository.findOne({
        select: ['post_id'],
        where: { post_id: postId },
      }),
      this.commentRepository.count({
        where: { post: { post_id: postId } },
      }),
    ]);

    if (!post) {
      throw new NotFoundException('게시물을 찾을 수 없습니다.');
    }

    // 댓글 생성
    const result = await this.commentRepository
      .createQueryBuilder()
      .insert()
      .into(Comment)
      .values({
        content: createCommentDto.content,
        userAccount: { user_id: userId },
        post: { post_id: postId },
      })
      .execute();

    // 정확한 카운트 업데이트
    await this.postRepository
      .createQueryBuilder()
      .update(Post)
      .set({ comments_count: currentCount + 1 })
      .where('post_id = :postId', { postId })
      .execute();

    return { commentId: result.identifiers[0].comment_id };
  }

  // 댓글 수정 메서드
  async updateComment(
    userId: number,
    postId: number,
    commentId: number,
    updateCommentDto: UpdateCommentDto,
  ): Promise<CommentUpdateResult> {
    // 단일 쿼리로 업데이트
    const result = await this.commentRepository
      .createQueryBuilder()
      .update(Comment)
      .set({ content: updateCommentDto.content })
      .where(
        'comment_id = :commentId AND userAccount.user_id = :userId AND post.post_id = :postId',
        {
          commentId,
          userId,
          postId,
        },
      )
      .execute();

    if (result.affected === 0) {
      throw new NotFoundException('댓글을 찾을 수 없습니다.');
    }

    return {
      commentId,
      content: updateCommentDto.content,
    };
  }

  async deleteComment(
    userId: number,
    postId: number,
    commentId: number,
  ): Promise<CommentDeleteResult> {
    // 현재 댓글 수 확인
    const currentCount = await this.commentRepository.count({
      where: {
        post: { post_id: postId },
        deleted_at: null,
      },
    });

    // 댓글 소프트 삭제
    const deleteResult = await this.commentRepository
      .createQueryBuilder()
      .softDelete()
      .where(
        'comment_id = :commentId AND userAccount.user_id = :userId AND post.post_id = :postId',
        { commentId, userId, postId },
      )
      .execute();

    if (deleteResult.affected === 0) {
      throw new NotFoundException(
        '댓글을 찾을 수 없거나 삭제 권한이 없습니다.',
      );
    }

    // 3. 정확한 카운트 업데이트
    await this.postRepository
      .createQueryBuilder()
      .update(Post)
      .set({ comments_count: currentCount - 1 })
      .where('post_id = :postId', { postId })
      .execute();

    return {
      commentId,
      isDeleted: true,
    };
  }

  // 댓글 좋아요/취소 메서드
  async likeComment(
    userId: number,
    postId: number,
    commentId: number,
  ): Promise<CommentLikeResult> {
    // 댓글 존재 확인 및 좋아요 수 한번에 조회
    try {
      const [comment, currentLikeCount] = await Promise.all([
        this.commentRepository.findOne({
          select: ['comment_id'],
          where: {
            comment_id: commentId,
            post: { post_id: postId },
          },
        }),
        this.commentLikeRepository.count({
          where: { comment: { comment_id: commentId } },
        }),
      ]);

      if (!comment) {
        throw new NotFoundException('댓글을 찾을 수 없습니다.');
      }

      // 좋아요 추가/제거 시도
      try {
        await this.commentLikeRepository
          .createQueryBuilder()
          .insert()
          .into(CommentLike)
          .values({
            comment: { comment_id: commentId },
            user: { user_id: userId },
          })
          .execute();

        // 정확한 카운트 반영
        await this.commentRepository
          .createQueryBuilder()
          .update(Comment)
          .set({ like_count: currentLikeCount + 1 })
          .where('comment_id = :commentId', { commentId })
          .execute();

        return {
          isLiked: true,
          likeCount: currentLikeCount + 1,
        };
      } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
          // 좋아요 제거 시도 정확한 카운트 반영
          await this.commentLikeRepository.delete({
            comment: { comment_id: commentId },
            user: { user_id: userId },
          });

          await this.commentRepository
            .createQueryBuilder()
            .update(Comment)
            .set({ like_count: currentLikeCount - 1 })
            .where('comment_id = :commentId', { commentId })
            .execute();

          return {
            isLiked: false,
            likeCount: currentLikeCount - 1,
          };
        }
        throw error;
      }
    } catch (error) {
      console.error('Like comment error:', error);
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(
        '좋아요 처리 중 오류가 발생했습니다.',
      );
    }
  }
}
