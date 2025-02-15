import { Test, TestingModule } from '@nestjs/testing';
import { CommentService } from './comment.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Comment } from '../entity/comment.entity';
import { CommentLike } from '../entity/comment-like.entity';
import { Post } from '../../post/entity/post.entity';
import { DataSource } from 'typeorm';
import {
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import {
  createMockComment,
  createMockPost,
  createMockQueryBuilder,
  createMockRepository,
} from '../../utils/test.utils';
import { ErrorMessageType } from '../../enums/error.message.enum';

describe('CommentService', () => {
  let service: CommentService;
  let mockCommentRepository;
  let mockCommentLikeRepository;
  let mockPostRepository;
  let queryBuilder;

  beforeEach(async () => {
    queryBuilder = createMockQueryBuilder();
    mockCommentRepository = createMockRepository<Comment>(queryBuilder);
    mockCommentLikeRepository = createMockRepository<CommentLike>(queryBuilder);
    mockPostRepository = createMockRepository<Post>(queryBuilder);

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
      const mockPost = createMockPost();
      mockPostRepository.findOne.mockResolvedValue(mockPost);

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
      const mockPost = createMockPost();
      mockPostRepository.findOne.mockResolvedValue(mockPost);
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
      const mockComment = createMockComment();
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
      const mockComment = createMockComment();
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
        new NotFoundException(ErrorMessageType.NOT_FOUND_COMMENT),
      );
    });

    it('should handle database errors properly', async () => {
      const mockComment = createMockComment();
      mockCommentRepository.findOne.mockResolvedValue(mockComment);
      mockCommentLikeRepository.count.mockResolvedValue(5);
      queryBuilder.execute.mockRejectedValue(new Error('DB Error'));

      await expect(service.likeComment(1, 1, 1)).rejects.toThrow(
        new InternalServerErrorException(
          ErrorMessageType.LIKE_PROCESSING_ERROR,
        ),
      );
    });

    it('should handle delete operation failure', async () => {
      const mockComment = createMockComment();
      mockCommentRepository.findOne.mockResolvedValue(mockComment);
      mockCommentLikeRepository.count.mockResolvedValue(5);
      queryBuilder.execute.mockRejectedValueOnce({ code: 'ER_DUP_ENTRY' });
      mockCommentLikeRepository.delete.mockRejectedValue(
        new Error('Delete failed'),
      );

      await expect(service.likeComment(1, 1, 1)).rejects.toThrow(
        new InternalServerErrorException(
          ErrorMessageType.LIKE_PROCESSING_ERROR,
        ),
      );
    });
  });
});
