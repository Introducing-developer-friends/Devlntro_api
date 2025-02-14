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
import { ErrorMessageType } from '../enums/error.message.enum';
@Injectable()
export class CommentService {
  constructor(
    @InjectRepository(Comment)
    private readonly commentRepository: Repository<Comment>,
    @InjectRepository(CommentLike)
    private readonly commentLikeRepository: Repository<CommentLike>,
    @InjectRepository(Post)
    private readonly postRepository: Repository<Post>,
  ) {}

  async createComment(
    userId: number,
    postId: number,
    createCommentDto: CreateCommentDto,
  ): Promise<CommentCreateResult> {
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
      throw new NotFoundException(ErrorMessageType.NOT_FOUND_POST);
    }

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

    await this.postRepository
      .createQueryBuilder()
      .update(Post)
      .set({ comments_count: currentCount + 1 })
      .where('post_id = :postId', { postId })
      .execute();

    return { commentId: result.identifiers[0].comment_id };
  }

  async updateComment(
    userId: number,
    postId: number,
    commentId: number,
    updateCommentDto: UpdateCommentDto,
  ): Promise<CommentUpdateResult> {
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
      throw new NotFoundException(ErrorMessageType.NOT_FOUND_COMMENT);
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
    const currentCount = await this.commentRepository.count({
      where: {
        post: { post_id: postId },
        deleted_at: null,
      },
    });

    const deleteResult = await this.commentRepository
      .createQueryBuilder()
      .softDelete()
      .where(
        'comment_id = :commentId AND userAccount.user_id = :userId AND post.post_id = :postId',
        { commentId, userId, postId },
      )
      .execute();

    if (deleteResult.affected === 0) {
      throw new NotFoundException(ErrorMessageType.NOT_FOUND_COMMENT);
    }

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

  async likeComment(
    userId: number,
    postId: number,
    commentId: number,
  ): Promise<CommentLikeResult> {
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
        throw new NotFoundException(ErrorMessageType.NOT_FOUND_COMMENT);
      }

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
