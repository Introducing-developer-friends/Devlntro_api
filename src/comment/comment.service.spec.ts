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

  it('should create a comment', async () => {
    // `queryRunner.manager.findOne`이 게시물을 반환하도록 mock 설정
    transactionalEntityManager.findOne.mockImplementation(async (entity, options) => {
      if (entity === Post) {
        return {
          post_id: 1,
          comments_count: 0,
        } as Post;
      }
      return null;
    });

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
      statusCode: 201,
      message: '댓글이 성공적으로 작성되었습니다.',
      commentId: 1,
    });
    expect(transactionalEntityManager.findOne).toHaveBeenCalledWith(Post, { where: { post_id: 1 } });
  });

  it('should throw NotFoundException when post not found', async () => {
    // 게시물을 찾지 못하도록 mock 설정
    transactionalEntityManager.findOne.mockResolvedValue(null);

    await expect(service.createComment(1, 1, { content: 'Test comment' }))
      .rejects
      .toThrow(NotFoundException);
  });

  it('should update a comment', async () => {
    mockCommentRepository.findOne.mockResolvedValue({
      comment_id: 1,
      content: 'Old content',
      userAccount: { user_id: 1 } as UserAccount,
    } as Comment);

    const result = await service.updateComment(1, 1, 1, { content: 'Updated comment' });

    expect(result).toEqual({
      statusCode: 200,
      message: '댓글이 성공적으로 수정되었습니다.',
    });
    expect(mockCommentRepository.save).toHaveBeenCalled();
  });

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
      statusCode: 200,
      message: '댓글이 성공적으로 삭제되었습니다.',
    });
    expect(mockCommentRepository.softRemove).toHaveBeenCalled();
    expect(mockPostRepository.save).toHaveBeenCalled();
  });

  it('should like a comment', async () => {
    // `transactionalEntityManager.createQueryBuilder().getOne()`이 댓글을 반환하도록 설정
    queryBuilder.getOne.mockResolvedValue({
      comment_id: 1,
      like_count: 0,
    } as Comment);

    // `transactionalEntityManager.findOne`이 좋아요를 찾지 못하도록 설정
    transactionalEntityManager.findOne.mockResolvedValue(null);

    // `transactionalEntityManager.save`가 새로운 좋아요를 반환하도록 설정
    transactionalEntityManager.save.mockResolvedValue({
      comment_like_id: 1,
    } as CommentLike);

    const result = await service.likeComment(1, 1, 1);

    expect(result).toEqual({
      statusCode: 200,
      message: '댓글에 좋아요를 눌렀습니다.',
      likeCount: 1,
    });
  });

  it('should remove like from a comment', async () => {
    // `transactionalEntityManager.createQueryBuilder().getOne()`이 댓글을 반환하도록 설정
    queryBuilder.getOne.mockResolvedValue({
      comment_id: 1,
      like_count: 1,
    } as Comment);

    // `transactionalEntityManager.findOne`이 기존 좋아요를 반환하도록 설정
    transactionalEntityManager.findOne.mockResolvedValue({
      comment_like_id: 1,
    } as CommentLike);

    // `transactionalEntityManager.remove`를 mock 설정
    transactionalEntityManager.remove.mockResolvedValue(undefined);

    const result = await service.likeComment(1, 1, 1);

    expect(result).toEqual({
      statusCode: 200,
      message: '댓글 좋아요를 취소했습니다.',
      likeCount: 0,
    });
  });
});
