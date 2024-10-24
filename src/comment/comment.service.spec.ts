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

    // transaction 관련 mock 설정
    transactionalEntityManager = {
      findOne: jest.fn(),
      save: jest.fn(),
      remove: jest.fn(),
      create: jest.fn(),
      createQueryBuilder: jest.fn().mockReturnValue(queryBuilder),
    };

    // QueryRunner mock 설정
    queryRunner = {
      manager: transactionalEntityManager,
      connect: jest.fn(),
      startTransaction: jest.fn(),
      commitTransaction: jest.fn(),
      rollbackTransaction: jest.fn(),
      release: jest.fn(),
    } as unknown as jest.Mocked<QueryRunner>;

    // 각 Repository를 mock 설정
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

    // 테스트 모듈 생성
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

    // CommentService 인스턴스 생성
    service = module.get<CommentService>(CommentService);
  });

  // 서비스가 정의되었는지 확인하는 기본 테스트
  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // createComment 메서드에 대한 테스트
  describe('createComment', () => {

    // 댓글이 정상적으로 생성되는지 테스트
    it('should create a comment', async () => {
      transactionalEntityManager.findOne.mockResolvedValue({
        post_id: 1,
        comments_count: 0,
      } as Post);

      // 댓글 생성
      transactionalEntityManager.create.mockReturnValue({
        comment_id: 1,
        content: 'Test comment',
      } as Comment);

      // 저장된 댓글 반환
      transactionalEntityManager.save.mockResolvedValue({
        comment_id: 1,
        content: 'Test comment',
      } as Comment);

      const result = await service.createComment(1, 1, { content: 'Test comment' });

      expect(result).toEqual({
        commentId: 1
      });

      // 트랜잭션이 성공적으로 커밋되었는지 확인
      expect(queryRunner.commitTransaction).toHaveBeenCalled();
    });

    // post가 존재하지 않는 경우 NotFoundException 발생 여부 확인
    it('should throw NotFoundException when post not found', async () => {
      transactionalEntityManager.findOne.mockResolvedValue(null);

      await expect(service.createComment(1, 1, { content: 'Test comment' }))
        .rejects
        .toThrow(NotFoundException);
      
      // 트랜잭션이 롤백되었는지 확인
      expect(queryRunner.rollbackTransaction).toHaveBeenCalled();
    });
  });

  // updateComment 메서드에 대한 테스트
  describe('updateComment', () => {
    it('should update a comment', async () => {
      const mockComment = {
        comment_id: 1,
        content: 'Old content',
        userAccount: { user_id: 1 } as UserAccount,
      } as Comment;

      // 기존 댓글을 찾고 업데이트
      mockCommentRepository.findOne.mockResolvedValue(mockComment);
      mockCommentRepository.save.mockResolvedValue({
        ...mockComment,
        content: 'Updated comment'
      });

      // updateComment 서비스 메서드 호출
      const result = await service.updateComment(1, 1, 1, { content: 'Updated comment' });

      // 결과가 예상한 값과 일치하는지 확인
      expect(result).toEqual({
        commentId: 1,
        content: 'Updated comment'
      });
    });

    // 댓글을 찾지 못한 경우 NotFoundException 발생 여부 확인
    it('should throw NotFoundException when comment not found', async () => {
      mockCommentRepository.findOne.mockResolvedValue(null);

      // NotFoundException이 발생하는지 확인
      await expect(service.updateComment(1, 1, 1, { content: 'Updated comment' }))
        .rejects
        .toThrow(NotFoundException);
    });
  });

  // deleteComment 메서드에 대한 테스트
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

      // deleteComment 서비스 메서드 호출
      const result = await service.deleteComment(1, 1, 1);

      // 결과가 예상한 값과 일치하는지 확인
      expect(result).toEqual({
        commentId: 1,
        isDeleted: true
      });

      // softRemove 및 Post 저장 여부 확인
      expect(mockCommentRepository.softRemove).toHaveBeenCalled();
      expect(mockPostRepository.save).toHaveBeenCalled();
    });

    // 댓글을 찾지 못한 경우 NotFoundException 발생 여부 확인
    it('should throw NotFoundException when comment not found', async () => {
      mockCommentRepository.findOne.mockResolvedValue(null);

      await expect(service.deleteComment(1, 1, 1))
        .rejects
        .toThrow(NotFoundException);
    });
  });

  // likeComment 메서드에 대한 테스트
  describe('likeComment', () => {
    it('should like a comment', async () => {
      queryBuilder.getOne.mockResolvedValue({
        comment_id: 1,
        like_count: 0,
      } as Comment);

      // 좋아요가 없는 경우 새로 생성
      transactionalEntityManager.findOne.mockResolvedValue(null);
      transactionalEntityManager.create.mockReturnValue({
        comment_like_id: 1,
      } as CommentLike);

      // likeComment 서비스 메서드 호출
      const result = await service.likeComment(1, 1, 1);

      expect(result).toEqual({
        isLiked: true,
        likeCount: 1
      });
    });

    // 좋아요 취소 테스트
    it('should remove like from a comment', async () => {
      queryBuilder.getOne.mockResolvedValue({
        comment_id: 1,
        like_count: 1,
      } as Comment);

      transactionalEntityManager.findOne.mockResolvedValue({
        comment_like_id: 1,
      } as CommentLike);

      // likeComment 서비스 메서드 호출
      const result = await service.likeComment(1, 1, 1);

      // 결과가 예상한 값과 일치하는지 확인
      expect(result).toEqual({
        isLiked: false,
        likeCount: 0
      });
    });

    // 댓글을 찾지 못한 경우 NotFoundException 발생 여부 확인
    it('should throw NotFoundException when comment not found', async () => {
      queryBuilder.getOne.mockResolvedValue(null);

      // NotFoundException이 발생하는지 확인
      await expect(service.likeComment(1, 1, 1))
        .rejects
        .toThrow(NotFoundException);
    });
  });
});
