import { Test, TestingModule } from '@nestjs/testing';
import { PostService } from './post.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Post } from '../entities/post.entity';
import { PostLike } from '../entities/post-like.entity';
import { S3Service } from '../s3/s3.service';
import { EntityManager } from 'typeorm';
import { InternalServerErrorException, NotFoundException } from '@nestjs/common';

describe('PostService', () => {
  let service: PostService;
  let mockPostRepository: any;
  let mockPostLikeRepository: any;
  let mockEntityManager: any;
  let mockS3Service: any;
  let mockQueryBuilder: any;
  let mockQueryRunner: any;

  // 각 테스트 전에 mock 객체와 테스트 모듈 설정
  beforeEach(async () => {

    // Post 리포지토리의 메서드들을 모의(mock)로 설정
    mockPostRepository = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      softRemove: jest.fn(),
      manager: { connection: { createQueryRunner: jest.fn() } },
    };

    // PostLikeRepository mock 설정
    mockPostLikeRepository = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      remove: jest.fn(),
    };

    // QueryBuilder mock 설정
    mockQueryBuilder = {
      setLock: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      getOne: jest.fn(),
    };

    // QueryRunner mock 설정
    mockQueryRunner = {
      connect: jest.fn(),
      startTransaction: jest.fn(),
      commitTransaction: jest.fn(),
      rollbackTransaction: jest.fn(),
      release: jest.fn(),
    };

    // QueryRunner 생성 시 mockQueryRunner 반환
    mockPostRepository.manager.connection.createQueryRunner.mockReturnValue(mockQueryRunner);

    // EntityManager mock 설정
    mockEntityManager = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      remove: jest.fn(),
      createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
      transaction: jest.fn((callback) => callback(mockEntityManager)),
    };

    // S3Service mock 설정
    mockS3Service = {
      uploadFile: jest.fn(),
      deleteFile: jest.fn(),
    };

    // 테스트 모듈 설정
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

  // likePost 메서드에 대한 테스트
  describe('likePost', () => {
    it('should like a post successfully when no like exists', async () => {
      const postId = 1;
      const userId = 1;
      const post = { post_id: postId, post_like_count: 0 };
      const newLike = { post_like_id: 1 };

      // mock 설정
      mockQueryBuilder.getOne.mockResolvedValue(post); // Post 찾기
      mockEntityManager.findOne.mockResolvedValueOnce(null); // 좋아요가 없을 때
      mockEntityManager.create.mockReturnValue(newLike); // 새로운 좋아요 객체 생성
      mockEntityManager.save.mockResolvedValue(newLike); // 좋아요 저장

      const result = await service.likePost(userId, postId);

      // 게시물의 좋아요 수가 증가했는지 확인
      expect(mockEntityManager.save).toHaveBeenCalledWith(post);
      expect(result).toEqual({
        statusCode: 200,
        message: '게시물에 좋아요를 눌렀습니다.',
        likeCount: 1,
      });
    });

    it('should remove like from a post successfully when like exists', async () => {
      const postId = 1;
      const userId = 1;
      const post = { post_id: postId, post_like_count: 1 };
      const existingLike = { post_like_id: 1 };

      // mock 설정
      mockQueryBuilder.getOne.mockResolvedValue(post); // Post 찾기
      mockEntityManager.findOne.mockResolvedValueOnce(existingLike); // 좋아요가 이미 있을 때
      mockEntityManager.remove.mockResolvedValue(existingLike); // 좋아요 제거

      const result = await service.likePost(userId, postId);

      expect(mockEntityManager.save).toHaveBeenCalledWith(post);
      expect(result).toEqual({
        statusCode: 200,
        message: '게시물 좋아요를 취소했습니다.',
        likeCount: 0,
      });
    });

    it('should throw NotFoundException when post is not found', async () => {
      mockQueryBuilder.getOne.mockResolvedValue(null);

      await expect(service.likePost(1, 999)).rejects.toThrow(NotFoundException);
    });

  });

  // createPost 메서드에 대한 테스트
  describe('createPost', () => {
    it('should create a post successfully', async () => {
      const postId = 1;
      const userId = 1;
      const createPostData = { content: 'Test Content', imageUrl: 'test-url' };
      const savedPost = { post_id: postId, image_url: 'test-url' };

      // mock 설정
      mockPostRepository.create.mockReturnValue(savedPost);
      mockPostRepository.save.mockResolvedValue(savedPost);

      const result = await service.createPost(userId, createPostData);

      // QueryRunner 트랜잭션이 제대로 처리되었는지 확인
      expect(mockQueryRunner.connect).toHaveBeenCalled();
      expect(mockPostRepository.create).toHaveBeenCalledWith({
        content: createPostData.content,
        image_url: createPostData.imageUrl,
        user: { user_id: userId },
      });
      expect(mockQueryRunner.commitTransaction).toHaveBeenCalled();
      expect(result).toEqual({
        statusCode: 201,
        message: '게시물이 성공적으로 작성되었습니다.',
        postId: savedPost.post_id,
        imageUrl: savedPost.image_url,
      });
    });

    it('should rollback transaction and throw error when save fails', async () => {
      mockPostRepository.save.mockRejectedValue(new Error('Save failed'));

      await expect(service.createPost(1, { content: 'Test', imageUrl: 'url' }))
        .rejects.toThrow(InternalServerErrorException);

      expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalled();
    });
  });

  // extractKeyFromUrl 메서드 모킹
  const mockExtractKeyFromUrl = (url: string) => {
    const match = url.match(/amazonaws\.com\/(.+)$/);
    return match ? match[1] : null;
  };

  // updatePost 메서드에 대한 테스트
  describe('updatePost', () => {
    it('should update a post successfully and delete old image from S3', async () => {
      const postId = 1;
      const userId = 1;
      const updatePostData = { content: 'Updated Content', imageUrl: 'https://example.com/amazonaws.com/new-key' };
      const post = { post_id: postId, content: 'Old Content', image_url: 'https://example.com/amazonaws.com/old-key' };

      mockPostRepository.findOne.mockResolvedValue(post);
      
      // extractKeyFromUrl 메서드 모킹
      jest.spyOn(service as any, 'extractKeyFromUrl').mockImplementation(mockExtractKeyFromUrl);

      const result = await service.updatePost(userId, postId, updatePostData);

      // S3에서 이전 이미지가 삭제되었는지 확인
      expect(mockS3Service.deleteFile).toHaveBeenCalledWith('old-key');
      expect(mockPostRepository.save).toHaveBeenCalledWith(expect.objectContaining({
        content: updatePostData.content,
        image_url: updatePostData.imageUrl
      }));
      expect(result).toEqual({
        statusCode: 200,
        message: '게시물이 성공적으로 수정되었습니다.',
      });
    });

    it('should throw NotFoundException when post is not found', async () => {
      mockPostRepository.findOne.mockResolvedValue(null);

      await expect(service.updatePost(1, 999, { content: 'Updated' }))
        .rejects.toThrow(NotFoundException);
    });
  });

  
  describe('deletePost', () => {
    it('should delete a post successfully and delete image from S3', async () => {
      const postId = 1;
      const userId = 1;
      const post = { post_id: postId, image_url: 'https://example.com/amazonaws.com/test-key' };
  
      mockPostRepository.findOne.mockResolvedValue(post);
      
      jest.spyOn(service as any, 'extractKeyFromUrl').mockImplementation(mockExtractKeyFromUrl);
  
      const result = await service.deletePost(userId, postId);
  
      expect(mockS3Service.deleteFile).toHaveBeenCalledWith('test-key');
      expect(mockPostRepository.softRemove).toHaveBeenCalledWith(post);
      expect(result).toEqual({
        statusCode: 200,
        message: '게시물이 성공적으로 삭제되었습니다.',
      });
    });
  
    it('should throw NotFoundException when post is not found', async () => {
      mockPostRepository.findOne.mockResolvedValue(null);
  
      await expect(service.deletePost(1, 999)).rejects.toThrow(NotFoundException);
    });
  });
});
