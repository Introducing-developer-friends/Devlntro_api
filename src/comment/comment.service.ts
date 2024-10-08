import { Injectable, NotFoundException  } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Comment } from '../entities/comment.entity';
import { CommentLike } from '../entities/comment-like.entity';
import { Post } from '../entities/post.entity';
import { CreateCommentDto, UpdateCommentDto } from './dto/comment.dto';

@Injectable()
export class CommentService {
  constructor(
    @InjectRepository(Comment)
    private commentRepository: Repository<Comment>, // Comment 엔티티를 위한 TypeORM 리포지토리 주입
    @InjectRepository(CommentLike)
    private commentLikeRepository: Repository<CommentLike>, // CommentLike 엔티티를 위한 TypeORM 리포지토리 주입
    @InjectRepository(Post)
    private postRepository: Repository<Post>,
    private dataSource: DataSource
  ) {}

  // 댓글 생성 메서드
  async createComment(userId: number, postId: number, createCommentDto: CreateCommentDto) {

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

    return {
      statusCode: 201,
      message: '댓글이 성공적으로 작성되었습니다.',
      commentId: comment.comment_id,
    };
  } catch (error) {
    await queryRunner.rollbackTransaction();
    throw error;
  } finally {
    await queryRunner.release();
  }
}

  // 댓글 수정 메서드
  async updateComment(userId: number, postId: number, commentId: number, updateCommentDto: UpdateCommentDto) {
    
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
      statusCode: 200,
      message: '댓글이 성공적으로 수정되었습니다.',
    };
  }

  async deleteComment(userId: number, postId: number, commentId: number) {
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
      statusCode: 200,
      message: '댓글이 성공적으로 삭제되었습니다.',
    };
  }

  // 댓글 좋아요/취소 메서드
  async likeComment(userId: number, postId: number, commentId: number) {
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
  
      if (existingLike) {
        await transactionalEntityManager.remove(existingLike);
        comment.like_count -= 1;
      } else {
        const newLike = transactionalEntityManager.create(CommentLike, {
          comment: { comment_id: commentId },
          user: { user_id: userId }
        });
        await transactionalEntityManager.save(newLike);
        comment.like_count += 1;
      }
  
      await transactionalEntityManager.save(comment);
  
      return {
        statusCode: 200,
        message: existingLike ? '댓글 좋아요를 취소했습니다.' : '댓글에 좋아요를 눌렀습니다.',
        likeCount: comment.like_count
      };
    });
  }

}