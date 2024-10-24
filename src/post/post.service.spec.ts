import { Test, TestingModule } from '@nestjs/testing';
import { PostService } from './post.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Post } from '../entities/post.entity';
import { PostLike } from '../entities/post-like.entity';
import { S3Service } from '../s3/s3.service';
import { EntityManager } from 'typeorm';
import { InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { 
  PostCreateData, 
  PostUpdateData,
  PostBasicInfo,
  PostLikeInfo
} from '../types/post.types';

describe('PostService', () => {
  let service: PostService;
  let mockPostRepository: any;
  let mockPostLikeRepository: any;
  let mockEntityManager: any;
  let mockS3Service: any;
  let mockQueryBuilder: any;
  let mockQueryRunner: any;

  // Mock 객체들을 설정하고 테스트 모듈을 구성하는 beforeEach 블록
  beforeEach(async () => {

    // QueryBuilder와 QueryRunner를 모의로 생성하여 트랜잭션 및 쿼리 관련 로직을 테스트
    mockQueryBuilder = {
      setLock: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      getOne: jest.fn(),
    };

    mockQueryRunner = {
      connect: jest.fn(),
      startTransaction: jest.fn(),
      commitTransaction: jest.fn(),
      rollbackTransaction: jest.fn(),
      release: jest.fn(),
    };

    // PostRepository와 PostLikeRepository의 mock 객체 생성
    mockPostRepository = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      softRemove: jest.fn(),
      manager: { 
        connection: { 
          createQueryRunner: jest.fn().mockReturnValue(mockQueryRunner) 
        } 
      },
    };

    mockPostLikeRepository = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      remove: jest.fn(),
    };

    // EntityManager와 S3Service에 대한 모의 객체 생성
    mockEntityManager = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      remove: jest.fn(),
      createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
      transaction: jest.fn((callback) => callback(mockEntityManager)),
    };

    mockS3Service = {
      uploadFile: jest.fn(),
      deleteFile: jest.fn(),
    };

    // PostService 테스트 모듈 설정
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PostService,
        { provide: getRepositoryToken(Post), useValue: mockPostRepository },
        { provide: getRepositoryToken(PostLike), useValue: mockPostLikeRepository },
        { provide: EntityManager, useValue: mockEntityManager },
        { provide: S3Service, useValue: mockS3Service },
      ],
    }).compile();

    service = module.get<PostService>(PostService);
  });

  describe('createPost', () => {

    // 게시물 생성 성공 시 로직 테스트
    it('should create a post successfully', async () => {
      const createPostData: PostCreateData = { 
        content: 'Test Content', 
        imageUrl: 'test-url' 
      };

      const savedPost = {
        post_id: 1,
        content: 'Test Content',
        image_url: 'test-url',
        post_like_count: 0
      };

      mockPostRepository.create.mockReturnValue(savedPost);
      mockPostRepository.save.mockResolvedValue(savedPost);

      const expectedResult: PostBasicInfo = {
        postId: 1,
        content: 'Test Content',
        imageUrl: 'test-url',
        likeCount: 0
      };

      // createPost 함수 호출 및 결과 확인
      const result = await service.createPost(1, createPostData);
      expect(result).toEqual(expectedResult);
      expect(mockQueryRunner.commitTransaction).toHaveBeenCalled();
    });

    // 게시물 저장 실패 시 트랜잭션 롤백 및 오류 처리 테스트
    it('should rollback transaction and throw error when save fails', async () => {
      mockPostRepository.save.mockRejectedValue(new Error('Save failed'));

      await expect(service.createPost(1, { content: 'Test', imageUrl: 'url' }))
        .rejects
        .toThrow(InternalServerErrorException);

      expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalled();
    });
  });

  describe('updatePost', () => {

    // 게시물 업데이트 성공 시 로직 테스트
    it('should update a post successfully', async () => {
      const updatePostData: PostUpdateData = {
        content: 'Updated Content',
        imageUrl: 'new-url'
      };

      const existingPost = {
        post_id: 1,
        content: 'Old Content',
        image_url: 'old-url',
        user: { user_id: 1 }
      };

      // PostRepository의 findOne 함수가 기존 게시물을 반환하도록 설정
      mockPostRepository.findOne.mockResolvedValue(existingPost);

      // updatePost 함수 호출
      await service.updatePost(1, 1, updatePostData);

      expect(mockPostRepository.save).toHaveBeenCalledWith(expect.objectContaining({
        content: updatePostData.content,
        image_url: updatePostData.imageUrl
      }));
    });

    // 게시물이 존재하지 않을 때 NotFoundException 처리 테스트
    it('should throw NotFoundException when post is not found', async () => {
      mockPostRepository.findOne.mockResolvedValue(null);

      await expect(service.updatePost(1, 999, { content: 'Updated' }))
        .rejects
        .toThrow(NotFoundException);
    });
  });

  describe('deletePost', () => {

    // 게시물 삭제 성공 시 로직 테스트
    it('should delete a post successfully', async () => {
      const post = {
        post_id: 1,
        image_url: 'test-url',
        user: { user_id: 1 }
      };

      // PostRepository의 findOne 함수가 게시물을 반환하도록 설정
      mockPostRepository.findOne.mockResolvedValue(post);
      
      await service.deletePost(1, 1);

      // softRemove 함수가 호출되었는지 확인
      expect(mockPostRepository.softRemove).toHaveBeenCalledWith(post);
    });

    // 게시물이 존재하지 않을 때 NotFoundException 처리 테스트
    it('should throw NotFoundException when post is not found', async () => {
      mockPostRepository.findOne.mockResolvedValue(null);

      await expect(service.deletePost(1, 999))
        .rejects
        .toThrow(NotFoundException);
    });
  });

  describe('likePost', () => {

    // 좋아요 기능 성공 시 로직 테스트 (좋아요가 없을 때)
    it('should like a post successfully when no like exists', async () => {
      const post = {
        post_id: 1,
        post_like_count: 0
      };

      // QueryBuilder와 EntityManager의 mock 설정
      mockQueryBuilder.getOne.mockResolvedValue(post);
      mockEntityManager.findOne.mockResolvedValue(null);

      const expectedResult: PostLikeInfo = {
        isLiked: true,
        likeCount: 1
      };

      // likePost 함수 호출 및 결과 확인
      const result = await service.likePost(1, 1);
      expect(result).toEqual(expectedResult);
    });

    // 좋아요 제거 기능 성공 시 로직 테스트 (좋아요가 있을 때)
    it('should remove like from a post successfully when like exists', async () => {
      const post = {
        post_id: 1,
        post_like_count: 1
      };

      const existingLike = {
        post_like_id: 1
      };

      mockQueryBuilder.getOne.mockResolvedValue(post);
      mockEntityManager.findOne.mockResolvedValue(existingLike);

      const expectedResult: PostLikeInfo = {
        isLiked: false,
        likeCount: 0
      };

      // unlikePost 함수 호출 및 결과 확인
      const result = await service.likePost(1, 1);
      expect(result).toEqual(expectedResult);
    });

    // 게시물이 존재하지 않을 때 NotFoundException 처리 테스트
    it('should throw NotFoundException when post is not found', async () => {
      mockQueryBuilder.getOne.mockResolvedValue(null);

      await expect(service.likePost(1, 999))
        .rejects
        .toThrow(NotFoundException);
    });
  });
});