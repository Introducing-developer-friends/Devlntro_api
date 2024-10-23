import { Test, TestingModule } from '@nestjs/testing';
import { CommentService } from './comment.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Comment } from '../entities/comment.entity';
import { CommentLike } from '../entities/comment-like.entity';
import { Post } from '../entities/post.entity';
import { UserAccount } from '../entities/user-account.entity';
import { Repository, DataSource, QueryRunner, SelectQueryBuilder } from 'typeorm';
import { NotFoundException } from '@nestjs/common';

describe('CommentService', () => {
  let service: CommentService;
  let mockCommentRepository: jest.Mocked<Repository<Comment>>;
  let mockCommentLikeRepository: jest.Mocked<Repository<CommentLike>>;
  let mockPostRepository: jest.Mocked<Repository<Post>>;
  let mockUserRepository: jest.Mocked<Repository<UserAccount>>;
  let mockDataSource: jest.Mocked<DataSource>;
  let queryRunner: jest.Mocked<QueryRunner>;
  let queryBuilder: jest.Mocked<SelectQueryBuilder<Comment>>;
  let transactionalEntityManager: any;

  beforeEach(async () => {
    // QueryBuilder를 mock하여 getOne을 사용하도록 설정
    queryBuilder = {
      setLock: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getOne: jest.fn(),
    } as unknown as jest.Mocked<SelectQueryBuilder<Comment>>;

    transactionalEntityManager = {
      findOne: jest.fn(),
      save: jest.fn(),
      remove: jest.fn(),
      create: jest.fn(),
      createQueryBuilder: jest.fn().mockReturnValue(queryBuilder),
    };

    queryRunner = {
      manager: transactionalEntityManager,
      connect: jest.fn(),
      startTransaction: jest.fn(),
      commitTransaction: jest.fn(),
      rollbackTransaction: jest.fn(),
      release: jest.fn(),
    } as unknown as jest.Mocked<QueryRunner>;

    mockCommentRepository = {
      findOne: jest.fn(),
      save: jest.fn(),
      softRemove: jest.fn(),
    } as any;

    mockCommentLikeRepository = {
      findOne: jest.fn(),
      save: jest.fn(),
      remove: jest.fn(),
    } as any;

    mockPostRepository = {
      findOne: jest.fn(),
      save: jest.fn(),
    } as any;

    mockUserRepository = {
      findOne: jest.fn(),
      save: jest.fn(),
    } as any;

    mockDataSource = {
      createQueryRunner: jest.fn().mockReturnValue(queryRunner),
      manager: {
        transaction: jest.fn().mockImplementation(async (cb) => cb(transactionalEntityManager)),
      },
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CommentService,
        { provide: getRepositoryToken(Comment), useValue: mockCommentRepository },
        { provide: getRepositoryToken(CommentLike), useValue: mockCommentLikeRepository },
        { provide: getRepositoryToken(Post), useValue: mockPostRepository },
        { provide: getRepositoryToken(UserAccount), useValue: mockUserRepository },
        { provide: DataSource, useValue: mockDataSource },
      ],
    }).compile();

    service = module.get<CommentService>(CommentService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createComment', () => {
    it('should create a comment', async () => {
      transactionalEntityManager.findOne.mockResolvedValue({
        post_id: 1,
        comments_count: 0,
      } as Post);

      transactionalEntityManager.create.mockReturnValue({
        comment_id: 1,
        content: 'Test comment',
      } as Comment);

      transactionalEntityManager.save.mockResolvedValue({
        comment_id: 1,
        content: 'Test comment',
      } as Comment);

      const result = await service.createComment(1, 1, { content: 'Test comment' });

      expect(result).toEqual({
        commentId: 1
      });
      expect(queryRunner.commitTransaction).toHaveBeenCalled();
    });

    it('should throw NotFoundException when post not found', async () => {
      transactionalEntityManager.findOne.mockResolvedValue(null);

      await expect(service.createComment(1, 1, { content: 'Test comment' }))
        .rejects
        .toThrow(NotFoundException);
      
      expect(queryRunner.rollbackTransaction).toHaveBeenCalled();
    });
  });

  describe('updateComment', () => {
    it('should update a comment', async () => {
      const mockComment = {
        comment_id: 1,
        content: 'Old content',
        userAccount: { user_id: 1 } as UserAccount,
      } as Comment;

      mockCommentRepository.findOne.mockResolvedValue(mockComment);
      mockCommentRepository.save.mockResolvedValue({
        ...mockComment,
        content: 'Updated comment'
      });

      const result = await service.updateComment(1, 1, 1, { content: 'Updated comment' });

      expect(result).toEqual({
        commentId: 1,
        content: 'Updated comment'
      });
    });

    it('should throw NotFoundException when comment not found', async () => {
      mockCommentRepository.findOne.mockResolvedValue(null);

      await expect(service.updateComment(1, 1, 1, { content: 'Updated comment' }))
        .rejects
        .toThrow(NotFoundException);
    });
  });

  describe('deleteComment', () => {
    it('should delete a comment', async () => {
      mockCommentRepository.findOne.mockResolvedValue({
        comment_id: 1,
        content: 'Comment content',
        post: {
          post_id: 1,
          comments_count: 2,
        } as Post,
        userAccount: { user_id: 1 } as UserAccount,
      } as Comment);

      const result = await service.deleteComment(1, 1, 1);

      expect(result).toEqual({
        commentId: 1,
        isDeleted: true
      });
      expect(mockCommentRepository.softRemove).toHaveBeenCalled();
      expect(mockPostRepository.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException when comment not found', async () => {
      mockCommentRepository.findOne.mockResolvedValue(null);

      await expect(service.deleteComment(1, 1, 1))
        .rejects
        .toThrow(NotFoundException);
    });
  });

  describe('likeComment', () => {
    it('should like a comment', async () => {
      queryBuilder.getOne.mockResolvedValue({
        comment_id: 1,
        like_count: 0,
      } as Comment);

      transactionalEntityManager.findOne.mockResolvedValue(null);
      transactionalEntityManager.create.mockReturnValue({
        comment_like_id: 1,
      } as CommentLike);

      const result = await service.likeComment(1, 1, 1);

      expect(result).toEqual({
        isLiked: true,
        likeCount: 1
      });
    });

    it('should remove like from a comment', async () => {
      queryBuilder.getOne.mockResolvedValue({
        comment_id: 1,
        like_count: 1,
      } as Comment);

      transactionalEntityManager.findOne.mockResolvedValue({
        comment_like_id: 1,
      } as CommentLike);

      const result = await service.likeComment(1, 1, 1);

      expect(result).toEqual({
        isLiked: false,
        likeCount: 0
      });
    });

    it('should throw NotFoundException when comment not found', async () => {
      queryBuilder.getOne.mockResolvedValue(null);

      await expect(service.likeComment(1, 1, 1))
        .rejects
        .toThrow(NotFoundException);
    });
  });
});
