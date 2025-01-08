import { Test, TestingModule } from '@nestjs/testing';
import { PostService } from './post.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Post } from '../entities/post.entity';
import { PostLike } from '../entities/post-like.entity';
import { S3Service } from '../s3/s3.service';
import { EntityManager, FindOneOptions } from 'typeorm';
import {
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { PostCreateData, PostUpdateData } from '../types/post.types';

// Mock Repository 타입 정의
type MockRepository<T> = {
  createQueryBuilder: jest.Mock;
  findOne: jest.Mock<Promise<Partial<T> | null>, [FindOneOptions<T>?]>;
};

// Mock PostLike Repository 타입 정의
type MockPostLikeRepository = MockRepository<PostLike> & {
  delete: jest.Mock;
};

describe('PostService', () => {
  let service: PostService;
  let mockPostRepository: MockRepository<Post>;
  let mockPostLikeRepository: MockPostLikeRepository;
  let mockEntityManager: { findOne: jest.Mock };
  let mockS3Service: { deleteFile: jest.Mock };

  // Mock 객체들을 설정하고 테스트 모듈을 구성하는 beforeEach 블록
  beforeEach(async () => {
    // QueryBuilder에 대한 모킹 설정
    const mockInsertQueryBuilder = {
      insert: jest.fn().mockReturnThis(),
      into: jest.fn().mockReturnThis(),
      values: jest.fn().mockReturnThis(),
      execute: jest.fn(),
    };

    const mockUpdateQueryBuilder = {
      update: jest.fn().mockReturnThis(),
      set: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      execute: jest.fn(),
    };

    const mockSelectQueryBuilder = {
      select: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getOne: jest.fn(),
    };

    const mockSoftDeleteQueryBuilder = {
      softDelete: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      execute: jest.fn(),
    };

    // Mock Repository 설정
    mockPostRepository = {
      createQueryBuilder: jest.fn().mockReturnValue({
        ...mockInsertQueryBuilder,
        ...mockUpdateQueryBuilder,
        ...mockSelectQueryBuilder,
        ...mockSoftDeleteQueryBuilder,
      }),
      findOne: jest.fn(),
    };

    mockPostLikeRepository = {
      createQueryBuilder: jest.fn().mockReturnValue({
        ...mockInsertQueryBuilder,
        ...mockUpdateQueryBuilder,
      }),
      delete: jest.fn(),
      findOne: jest.fn(),
    };

    mockEntityManager = {
      findOne: jest.fn(),
    };

    mockS3Service = {
      deleteFile: jest.fn(),
    };

    // PostService 테스트 모듈 설정
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PostService,
        { provide: getRepositoryToken(Post), useValue: mockPostRepository },
        {
          provide: getRepositoryToken(PostLike),
          useValue: mockPostLikeRepository,
        },
        { provide: EntityManager, useValue: mockEntityManager },
        { provide: S3Service, useValue: mockS3Service },
      ],
    }).compile();

    service = module.get<PostService>(PostService);
  });

  // 게시물 생성 관련 테스트
  describe('createPost', () => {
    // 게시물 생성 성공 시 로직 테스트
    it('should create a post successfully', async () => {
      const createPostData: PostCreateData = {
        content: 'Test Content',
        imageUrl: 'test-url',
      };

      // QueryBuilder의 execute 결과 모킹
      mockPostRepository.createQueryBuilder().execute.mockResolvedValueOnce({
        identifiers: [{ post_id: 1 }],
      });

      // 서비스 호출
      const result = await service.createPost(1, createPostData);

      expect(result).toEqual({
        postId: 1,
        content: 'Test Content',
        imageUrl: 'test-url',
        likeCount: 0,
      });
    });

    it('should handle database error during post creation', async () => {
      mockPostRepository
        .createQueryBuilder()
        .execute.mockRejectedValueOnce(new Error('DB Error'));

      await expect(
        service.createPost(1, {
          content: 'Test',
          imageUrl: '',
        }),
      ).rejects.toThrow(InternalServerErrorException);
    });

    it('should handle invalid user_id during post creation', async () => {
      mockPostRepository
        .createQueryBuilder()
        .execute.mockRejectedValueOnce({ code: 'ER_NO_REFERENCED_ROW_2' });

      await expect(
        service.createPost(999, {
          content: 'Test',
          imageUrl: 'test-url',
        }),
      ).rejects.toThrow(InternalServerErrorException);
    });
  });

  // 게시물 업데이트 관련 테스트
  describe('updatePost', () => {
    // 게시물 업데이트 성공 시 로직 테스트
    it('should update a post successfully', async () => {
      const updateData: PostUpdateData = {
        content: 'Updated',
        imageUrl: 'new-url',
      };

      mockPostRepository.createQueryBuilder().getOne.mockResolvedValueOnce({
        image_url: 'old-url',
      });

      mockPostRepository.createQueryBuilder().execute.mockResolvedValueOnce({
        affected: 1,
      });

      await service.updatePost(1, 1, updateData);

      expect(mockPostRepository.createQueryBuilder().update).toHaveBeenCalled();
    });

    it('should handle image update with S3 deletion', async () => {
      // 기존 이미지 URL 모킹
      mockPostRepository.createQueryBuilder().getOne.mockResolvedValueOnce({
        image_url: 'https://amazonaws.com/old-key',
      });

      mockPostRepository.createQueryBuilder().execute.mockResolvedValueOnce({
        affected: 1,
      });

      await service.updatePost(1, 1, { imageUrl: 'new-url' });

      expect(mockS3Service.deleteFile).toHaveBeenCalledWith('old-key');
    });

    it('should handle S3 deletion failure gracefully', async () => {
      // S3 삭제 실패 모킹
      mockPostRepository.createQueryBuilder().getOne.mockResolvedValueOnce({
        image_url: 'https://amazonaws.com/old-key',
      });

      mockPostRepository.createQueryBuilder().execute.mockResolvedValueOnce({
        affected: 1,
      });

      mockS3Service.deleteFile.mockRejectedValueOnce(new Error('S3 Error'));

      // Should not throw error even if S3 deletion fails
      await expect(
        service.updatePost(1, 1, { imageUrl: 'new-url' }),
      ).resolves.not.toThrow();
    });

    it('should update only content when imageUrl is not provided', async () => {
      const updateData: PostUpdateData = { content: 'Updated content only' };

      mockPostRepository.createQueryBuilder().execute.mockResolvedValueOnce({
        affected: 1,
      });

      await service.updatePost(1, 1, updateData);

      // image_url 관련 쿼리가 실행되지 않았는지 확인
      expect(
        mockPostRepository.createQueryBuilder().select,
      ).not.toHaveBeenCalled();
      expect(mockS3Service.deleteFile).not.toHaveBeenCalled();
    });

    it('should not call S3 delete when new imageUrl is same as old', async () => {
      const sameImageUrl = 'https://amazonaws.com/same-image.jpg';

      mockPostRepository.createQueryBuilder().getOne.mockResolvedValueOnce({
        image_url: sameImageUrl,
      });

      mockPostRepository.createQueryBuilder().execute.mockResolvedValueOnce({
        affected: 1,
      });

      await service.updatePost(1, 1, { imageUrl: sameImageUrl });

      expect(mockS3Service.deleteFile).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when post not found during image update', async () => {
      mockPostRepository
        .createQueryBuilder()
        .getOne.mockResolvedValueOnce(null);

      await expect(
        service.updatePost(1, 1, { imageUrl: 'new-url' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should handle image change without old image', async () => {
      mockPostRepository.createQueryBuilder().getOne.mockResolvedValueOnce({
        image_url: null,
      });

      mockPostRepository.createQueryBuilder().execute.mockResolvedValueOnce({
        affected: 1,
      });

      await expect(
        service.updatePost(1, 1, { imageUrl: 'new-url' }),
      ).resolves.not.toThrow();
    });

    it('should throw NotFoundException when trying to update with wrong userId', async () => {
      // getOne에서 null을 반환하도록 설정
      mockPostRepository
        .createQueryBuilder()
        .getOne.mockResolvedValueOnce(null);

      // execute는 호출되지 않아야 함
      mockPostRepository
        .createQueryBuilder()
        .execute.mockResolvedValueOnce(undefined);

      await expect(
        service.updatePost(2, 1, { imageUrl: 'new-url' }),
      ).rejects.toThrow(NotFoundException);

      // getOne이 호출되었는지 확인
      expect(mockPostRepository.createQueryBuilder().getOne).toHaveBeenCalled();
    });

    it('should handle null values in update data', async () => {
      // Post 조회 결과 설정 (이미지 URL 포함)
      mockPostRepository.createQueryBuilder().getOne.mockResolvedValueOnce({
        image_url: 'old-url',
      });

      // update 실행 결과 설정
      mockPostRepository.createQueryBuilder().execute.mockResolvedValueOnce({
        affected: 1,
      });

      // content가 null인 업데이트 실행
      await service.updatePost(1, 1, { content: null });

      // update 쿼리가 호출되었는지 확인
      expect(mockPostRepository.createQueryBuilder().update).toHaveBeenCalled();
      expect(mockPostRepository.createQueryBuilder().set).toHaveBeenCalledWith(
        expect.objectContaining({
          content: null,
        }),
      );
    });
  });

  describe('deletePost', () => {
    it('should delete a post and its image successfully', async () => {
      // 게시물 데이터와 이미지 URL 모킹
      mockPostRepository.createQueryBuilder().getOne.mockResolvedValueOnce({
        image_url: 'https://amazonaws.com/test-key',
      });

      mockPostRepository.createQueryBuilder().execute.mockResolvedValueOnce({
        affected: 1,
      });

      // 서비스 호출
      await service.deletePost(1, 1);

      // S3 삭제 호출 확인
      expect(mockS3Service.deleteFile).toHaveBeenCalledWith('test-key');
    });

    it('should handle invalid image URL during deletion', async () => {
      // 잘못된 이미지 URL
      mockPostRepository.createQueryBuilder().getOne.mockResolvedValueOnce({
        image_url: 'invalid-url',
      });

      mockPostRepository.createQueryBuilder().execute.mockResolvedValueOnce({
        affected: 1,
      });

      await expect(service.deletePost(1, 1)).resolves.not.toThrow();
    });

    it('should handle post deletion without image', async () => {
      // 이미지 URL이 없는 게시물 데이터 모킹
      mockPostRepository.createQueryBuilder().getOne.mockResolvedValueOnce({
        image_url: null,
      });

      mockPostRepository.createQueryBuilder().execute.mockResolvedValueOnce({
        affected: 1,
      });

      // 서비스 호출
      await service.deletePost(1, 1);
      expect(mockS3Service.deleteFile).not.toHaveBeenCalled();
    });

    it('should handle soft delete after finding post', async () => {
      mockPostRepository.createQueryBuilder().getOne.mockResolvedValueOnce({
        image_url: 'test-url',
      });

      mockPostRepository.createQueryBuilder().execute.mockResolvedValueOnce({
        affected: 0,
      });

      // 실제 로직에서는 getOne에서 post를 찾지 못할 때만 NotFoundException을 던짐
      await expect(service.deletePost(1, 1)).resolves.not.toThrow();
    });
  });

  // 게시물 좋아요 관련 테스트
  describe('likePost', () => {
    it('should handle case when affected rows is 0 during unlike', async () => {
      mockPostLikeRepository
        .createQueryBuilder()
        .execute.mockRejectedValueOnce({
          code: 'ER_DUP_ENTRY',
        });

      mockPostLikeRepository.delete.mockResolvedValueOnce({ affected: 0 });
      mockPostRepository.findOne.mockResolvedValueOnce({
        post_like_count: 0,
      });

      const result = await service.likePost(1, 1);
      expect(result).toEqual({
        isLiked: false,
        likeCount: 0,
      });
    });

    it('should handle non-existent post during like operation', async () => {
      mockPostLikeRepository
        .createQueryBuilder()
        .execute.mockRejectedValueOnce({
          code: 'ER_NO_REFERENCED_ROW_2',
        });

      await expect(service.likePost(1, 999)).rejects.toThrow(NotFoundException);
    });

    it('should handle database error during like operation', async () => {
      mockPostLikeRepository
        .createQueryBuilder()
        .execute.mockRejectedValueOnce(new Error('DB Error'));

      await expect(service.likePost(1, 1)).rejects.toThrow(
        InternalServerErrorException,
      );
    });

    it('should return 0 like count when post_like_count is null', async () => {
      mockPostLikeRepository
        .createQueryBuilder()
        .execute.mockResolvedValueOnce({});
      mockPostRepository.createQueryBuilder().execute.mockResolvedValueOnce({});
      mockPostRepository.findOne.mockResolvedValueOnce({
        post_like_count: null,
      });

      const result = await service.likePost(1, 1);

      expect(result.likeCount).toBe(0);
    });

    it('should handle consecutive like/unlike operations by same user', async () => {
      // 첫 번째: 좋아요 성공
      mockPostLikeRepository
        .createQueryBuilder()
        .execute.mockResolvedValueOnce({});
      mockPostRepository.createQueryBuilder().execute.mockResolvedValueOnce({});
      mockPostRepository.findOne.mockResolvedValueOnce({
        post_like_count: 1,
      });

      const firstResult = await service.likePost(1, 1);
      expect(firstResult).toEqual({
        isLiked: true,
        likeCount: 1,
      });

      // 두 번째: 좋아요 취소 (ER_DUP_ENTRY 발생)
      mockPostLikeRepository
        .createQueryBuilder()
        .execute.mockRejectedValueOnce({ code: 'ER_DUP_ENTRY' });
      mockPostLikeRepository.delete.mockResolvedValueOnce({ affected: 1 });
      mockPostRepository.findOne.mockResolvedValueOnce({
        post_like_count: 0,
      });

      const secondResult = await service.likePost(1, 1);
      expect(secondResult).toEqual({
        isLiked: false,
        likeCount: 0,
      });
    });

    it('should handle post not found during like count update', async () => {
      mockPostLikeRepository
        .createQueryBuilder()
        .execute.mockResolvedValueOnce({});

      mockPostRepository.createQueryBuilder().execute.mockResolvedValueOnce({
        affected: 0,
      });

      mockPostRepository.findOne.mockResolvedValueOnce({
        post_like_count: 1,
      });

      const result = await service.likePost(1, 1);

      expect(result).toEqual({
        isLiked: true,
        likeCount: 1,
      });
    });

    it('should handle concurrent like operations correctly', async () => {
      // 첫 번째 시도: 좋아요 추가 실패 (이미 존재)
      mockPostLikeRepository
        .createQueryBuilder()
        .execute.mockRejectedValueOnce({ code: 'ER_DUP_ENTRY' });

      // 두 번째 시도: 좋아요 삭제
      mockPostLikeRepository.delete.mockResolvedValueOnce({ affected: 1 });

      // 최종 좋아요 수 조회
      mockPostRepository.findOne.mockResolvedValueOnce({ post_like_count: 0 });

      const result = await service.likePost(1, 1);
      expect(result.isLiked).toBe(false);
      expect(result.likeCount).toBe(0);
    });

    it('should maintain proper like count on null values', async () => {
      mockPostLikeRepository
        .createQueryBuilder()
        .execute.mockResolvedValueOnce({});
      mockPostRepository.createQueryBuilder().execute.mockResolvedValueOnce({});
      mockPostRepository.findOne.mockResolvedValueOnce({
        post_like_count: null,
      });

      const result = await service.likePost(1, 1);
      expect(result.likeCount).toBe(0);
    });
  });

  describe('extractKeyFromUrl', () => {
    it('should extract correct S3 key from various URL patterns', async () => {
      const testCases = [
        {
          url: 'https://my-bucket.s3.amazonaws.com/folder/image.jpg',
          expected: 'folder/image.jpg',
        },
        {
          url: 'https://s3.amazonaws.com/my-bucket/test.png',
          expected: 'my-bucket/test.png',
        },
        {
          url: 'invalid-url',
          expected: null,
        },
        {
          url: 'https://not-amazon.com/image.jpg',
          expected: null,
        },
      ];

      for (const { url, expected } of testCases) {
        const result = service['extractKeyFromUrl'](url);
        expect(result).toBe(expected);
      }
    });

    describe('edge cases', () => {
      it('should handle empty update data', async () => {
        mockPostRepository.createQueryBuilder().execute.mockResolvedValueOnce({
          affected: 1,
        });

        await expect(service.updatePost(1, 1, {})).resolves.not.toThrow();
      });

      it('should handle malformed image URLs', async () => {
        const malformedUrls = [
          '',
          'not-a-url',
          'http://not-amazon.com/key',
          null,
          undefined,
        ];

        for (const url of malformedUrls) {
          mockPostRepository.createQueryBuilder().getOne.mockResolvedValueOnce({
            image_url: url,
          });

          mockPostRepository
            .createQueryBuilder()
            .execute.mockResolvedValueOnce({
              affected: 1,
            });

          await expect(service.deletePost(1, 1)).resolves.not.toThrow();
        }
      });

      it('should handle concurrent like operations', async () => {
        mockPostLikeRepository
          .createQueryBuilder()
          .execute.mockRejectedValueOnce({ code: 'ER_DUP_ENTRY' });

        mockPostLikeRepository.delete.mockResolvedValueOnce({ affected: 1 });

        mockPostRepository.findOne.mockResolvedValueOnce({
          post_like_count: 0,
        });

        await expect(service.likePost(1, 1)).resolves.not.toThrow();
      });
    });
  });
});
