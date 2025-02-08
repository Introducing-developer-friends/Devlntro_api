import { Test, TestingModule } from '@nestjs/testing';
import { CommentService } from './comment.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Comment } from '../entities/comment.entity';
import { CommentLike } from '../entities/comment-like.entity';
import { Post } from '../entities/post.entity';
import { Repository, DataSource, SelectQueryBuilder } from 'typeorm';
import {
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';

describe('CommentService', () => {
  let service: CommentService;
  let mockCommentRepository: jest.Mocked<Repository<Comment>>;
  let mockCommentLikeRepository: jest.Mocked<Repository<CommentLike>>;
  let mockPostRepository: jest.Mocked<Repository<Post>>;
  let queryBuilder: jest.Mocked<SelectQueryBuilder<Comment>>;

  beforeEach(async () => {
    queryBuilder = {
      insert: jest.fn().mockReturnThis(),
      into: jest.fn().mockReturnThis(),
      values: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      set: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      execute: jest.fn(),
      softDelete: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
    } as unknown as jest.Mocked<SelectQueryBuilder<Comment>>;

    mockCommentRepository = {
      createQueryBuilder: jest.fn().mockReturnValue(queryBuilder),
      findOne: jest.fn(),
      count: jest.fn(),
    } as unknown as jest.Mocked<Repository<Comment>>;

    mockCommentLikeRepository = {
      createQueryBuilder: jest.fn().mockReturnValue(queryBuilder),
      count: jest.fn(),
      delete: jest.fn(),
    } as unknown as jest.Mocked<Repository<CommentLike>>;

    mockPostRepository = {
      createQueryBuilder: jest.fn().mockReturnValue(queryBuilder),
      findOne: jest.fn(),
    } as unknown as jest.Mocked<Repository<Post>>;

    // 테스트 모듈 생성
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CommentService,
        {
          provide: getRepositoryToken(Comment),
          useValue: mockCommentRepository,
        },
        {
          provide: getRepositoryToken(CommentLike),
          useValue: mockCommentLikeRepository,
        },
        {
          provide: getRepositoryToken(Post),
          useValue: mockPostRepository,
        },
        {
          provide: DataSource,
          useValue: {},
        },
      ],
    }).compile();

    service = module.get<CommentService>(CommentService);
  });

  describe('createComment', () => {
    it('should create comment successfully', async () => {
      mockPostRepository.findOne.mockResolvedValue({ post_id: 1 } as Post);

      mockCommentRepository.count.mockResolvedValue(5);

      queryBuilder.execute.mockResolvedValueOnce({
        identifiers: [{ comment_id: 1 }],
        raw: [],
        affected: 1,
      });

      queryBuilder.execute.mockResolvedValueOnce({
        raw: [],
        affected: 1,
      });

      const result = await service.createComment(1, 1, {
        content: 'Test comment',
      });
      expect(result).toEqual({ commentId: 1 });
    });

    it('should throw NotFoundException when post not found', async () => {
      mockPostRepository.findOne.mockResolvedValue(null);
      mockCommentRepository.count.mockResolvedValue(0);

      await expect(
        service.createComment(1, 1, { content: 'Test comment' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should handle count query failure', async () => {
      mockPostRepository.findOne.mockResolvedValue({ post_id: 1 } as Post);
      const error = new Error('Count failed');
      mockCommentRepository.count.mockRejectedValue(error);

      await expect(
        service.createComment(1, 1, { content: 'Test' }),
      ).rejects.toThrow(Error);
    });

    it('should validate comment content', async () => {
      await expect(
        service.createComment(1, 1, { content: '' }),
      ).rejects.toThrow();
    });
  });

  describe('updateComment', () => {
    it('should update comment successfully', async () => {
      queryBuilder.execute.mockResolvedValue({ affected: 1 });

      const result = await service.updateComment(1, 1, 1, {
        content: 'Updated content',
      });

      expect(result).toEqual({
        commentId: 1,
        content: 'Updated content',
      });
    });

    it('should handle update query failure', async () => {
      const error = new Error('Update failed');
      queryBuilder.execute.mockRejectedValue(error);

      await expect(
        service.updateComment(1, 1, 1, { content: 'Updated' }),
      ).rejects.toThrow(Error);
    });
  });

  describe('deleteComment', () => {
    it('should delete comment successfully', async () => {
      mockCommentRepository.count.mockResolvedValue(5);

      queryBuilder.execute.mockResolvedValueOnce({
        affected: 1,
        raw: [],
      });

      queryBuilder.execute.mockResolvedValueOnce({
        affected: 1,
        raw: [],
      });

      const result = await service.deleteComment(1, 1, 1);
      expect(result).toEqual({
        commentId: 1,
        isDeleted: true,
      });
    });

    it('should throw NotFoundException when comment not found', async () => {
      mockCommentRepository.count.mockResolvedValue(5);
      queryBuilder.execute.mockResolvedValueOnce({ affected: 0 });

      await expect(service.deleteComment(1, 1, 1)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should handle count query failure', async () => {
      const error = new Error('Count failed');
      mockCommentRepository.count.mockRejectedValue(error);

      await expect(service.deleteComment(1, 1, 1)).rejects.toThrow(Error);
    });

    it('should handle update count failure after successful delete', async () => {
      mockCommentRepository.count.mockResolvedValue(5);
      queryBuilder.execute
        .mockResolvedValueOnce({ affected: 1 })
        .mockRejectedValueOnce(new Error('Update count failed'));

      await expect(service.deleteComment(1, 1, 1)).rejects.toThrow(Error);
    });

    it('should handle soft delete failure', async () => {
      mockCommentRepository.count.mockResolvedValue(5);
      const error = new Error('Soft delete failed');
      queryBuilder.execute.mockRejectedValue(error);

      await expect(service.deleteComment(1, 1, 1)).rejects.toThrow(Error);
    });
  });

  describe('likeComment', () => {
    it('should like comment successfully', async () => {
      const mockComment = { comment_id: 1 } as Comment;
      mockCommentRepository.findOne.mockResolvedValue(mockComment);
      mockCommentLikeRepository.count.mockResolvedValue(5);

      queryBuilder.execute.mockResolvedValueOnce({
        raw: [],
        affected: 1,
      });

      queryBuilder.execute.mockResolvedValueOnce({
        raw: [],
        affected: 1,
      });

      const result = await service.likeComment(1, 1, 1);
      expect(result).toEqual({
        isLiked: true,
        likeCount: 6,
      });
    });

    it('should unlike comment when already liked', async () => {
      const mockComment = { comment_id: 1 } as Comment;
      mockCommentRepository.findOne.mockResolvedValue(mockComment);
      mockCommentLikeRepository.count.mockResolvedValue(5);

      queryBuilder.execute.mockRejectedValueOnce({
        code: 'ER_DUP_ENTRY',
      });

      mockCommentLikeRepository.delete.mockResolvedValue({
        affected: 1,
        raw: [],
      });

      queryBuilder.execute.mockResolvedValueOnce({
        raw: [],
        affected: 1,
      });

      const result = await service.likeComment(1, 1, 1);
      expect(result).toEqual({
        isLiked: false,
        likeCount: 4,
      });
    });

    it('should throw NotFoundException when comment not found', async () => {
      mockCommentRepository.findOne.mockResolvedValue(null);
      mockCommentLikeRepository.count.mockResolvedValue(0);

      await expect(service.likeComment(1, 1, 1)).rejects.toThrow(
        new NotFoundException('댓글을 찾을 수 없습니다.'),
      );
    });

    it('should handle database errors properly', async () => {
      mockCommentRepository.findOne.mockResolvedValue({
        comment_id: 1,
      } as Comment);
      mockCommentLikeRepository.count.mockResolvedValue(5);
      queryBuilder.execute.mockRejectedValue(new Error('DB Error'));

      await expect(service.likeComment(1, 1, 1)).rejects.toThrow(
        new InternalServerErrorException('좋아요 처리 중 오류가 발생했습니다.'),
      );
    });

    it('should handle delete operation failure', async () => {
      mockCommentRepository.findOne.mockResolvedValue({
        comment_id: 1,
      } as Comment);
      mockCommentLikeRepository.count.mockResolvedValue(5);
      queryBuilder.execute.mockRejectedValueOnce({ code: 'ER_DUP_ENTRY' });
      mockCommentLikeRepository.delete.mockRejectedValue(
        new Error('Delete failed'),
      );

      await expect(service.likeComment(1, 1, 1)).rejects.toThrow(
        new InternalServerErrorException('좋아요 처리 중 오류가 발생했습니다.'),
      );
    });
  });
});
