import { Injectable, NotFoundException  } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Comment } from '../entities/comment.entity';
import { CommentLike } from '../entities/comment-like.entity';
import { Post } from '../entities/post.entity';
import { CreateCommentDto, UpdateCommentDto } from './dto/comment.dto';
import { 
  CommentCreateResult,
  CommentUpdateResult,
  CommentDeleteResult,
  CommentLikeResult 
} from '../types/comment.types';
@Injectable()
export class CommentService {
  constructor(
    @InjectRepository(Comment)
    private readonly  commentRepository: Repository<Comment>, // Comment 엔티티를 위한 TypeORM 리포지토리 주입
    @InjectRepository(CommentLike)
    private readonly  commentLikeRepository: Repository<CommentLike>, // CommentLike 엔티티를 위한 TypeORM 리포지토리 주입
    @InjectRepository(Post)
    private readonly  postRepository: Repository<Post>,
    private readonly  dataSource: DataSource
  ) {}

  // 댓글 생성 메서드
  async createComment(
    userId: number, 
    postId: number, 
    createCommentDto: CreateCommentDto
  ): Promise<CommentCreateResult> {

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
    const post = await queryRunner.manager.findOne(Post, { where: { post_id: postId } });
    if (!post) {
      throw new NotFoundException('게시물을 찾을 수 없습니다.');
    }

    const comment = queryRunner.manager.create(Comment, {
      ...createCommentDto,
      userAccount: { user_id: userId },
      post: { post_id: postId },
    });

    await queryRunner.manager.save(comment);

    // 게시물의 댓글 수 업데이트
    post.comments_count += 1;
    await queryRunner.manager.save(post);

    await queryRunner.commitTransaction();

      return { commentId: comment.comment_id };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  // 댓글 수정 메서드
  async updateComment(
    userId: number, 
    postId: number, 
    commentId: number, 
    updateCommentDto: UpdateCommentDto
  ): Promise<CommentUpdateResult> {
    
    // 댓글 ID, 게시물 ID, 사용자 ID를 기반으로 댓글 조회
    const comment = await this.commentRepository.findOne({
      where: { comment_id: commentId, post: { post_id: postId }, userAccount: { user_id: userId } },
    });

    // 댓글이 존재하지 않을 경우 예외 처리
    if (!comment) {
      throw new NotFoundException('댓글을 찾을 수 없습니다.');
    }

    // 댓글 내용 업데이트
    comment.content = updateCommentDto.content;
    await this.commentRepository.save(comment); // 업데이트된 댓글을 데이터베이스에 저장

    return {
      commentId: comment.comment_id,
      content: comment.content
    };
  }

  async deleteComment(
    userId: number, 
    postId: number, 
    commentId: number
  ): Promise<CommentDeleteResult> {
    const comment = await this.commentRepository.findOne({
      where: { comment_id: commentId, post: { post_id: postId }, userAccount: { user_id: userId } },
      relations: ['post'],
    });

    if (!comment) {
      throw new NotFoundException('댓글을 찾을 수 없습니다.');
    }

    await this.commentRepository.softRemove(comment);

    // 게시물의 댓글 수 감소
    comment.post.comments_count -= 1;
    await this.postRepository.save(comment.post);

    return {
      commentId,
      isDeleted: true
    };
  }

  // 댓글 좋아요/취소 메서드
  async likeComment(
    userId: number, 
    postId: number, 
    commentId: number
  ): Promise<CommentLikeResult> {
    return this.dataSource.manager.transaction(async transactionalEntityManager => {
      // SELECT ... FOR UPDATE를 사용하여 행 잠금
      const comment = await transactionalEntityManager
        .createQueryBuilder(Comment, "comment")
        .setLock("pessimistic_write")
        .where("comment.comment_id = :commentId", { commentId })
        .andWhere("comment.post.post_id = :postId", { postId })
        .getOne();
  
      if (!comment) {
        throw new NotFoundException('댓글을 찾을 수 없습니다.');
      }
  
      const existingLike = await transactionalEntityManager.findOne(CommentLike, {
        where: { comment: { comment_id: commentId }, user: { user_id: userId } }
      });

      let isLiked = false;

      if (existingLike) {
        await transactionalEntityManager.remove(existingLike);
        comment.like_count -= 1;
        isLiked = false;
      } else {
        const newLike = transactionalEntityManager.create(CommentLike, {
          comment: { comment_id: commentId },
          user: { user_id: userId }
        });
        await transactionalEntityManager.save(newLike);
        comment.like_count += 1;
        isLiked = true;
      }
  
      await transactionalEntityManager.save(comment);
  
      return {
        isLiked,
        likeCount: comment.like_count
      };
    });
  }

}