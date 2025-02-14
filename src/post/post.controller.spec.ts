import { Test, TestingModule } from '@nestjs/testing';
import { PostController } from './post.controller';
import { PostService } from './post.service';
import { S3Service } from '../s3/s3.service';

import { HttpStatus } from '@nestjs/common';
import { PostCreateResponse, PostLikeResponse } from '../types/post.types';
import { BaseResponse } from 'src/types/response.type';

describe('PostController', () => {
  let controller: PostController;
  let mockPostService: Partial<PostService>;
  let mockS3Service: Partial<S3Service>;

  beforeEach(async () => {
    mockPostService = {
      createPost: jest.fn(),
      updatePost: jest.fn(),
      deletePost: jest.fn(),
      likePost: jest.fn(),
    };

    mockS3Service = {
      uploadFile: jest.fn(),
      deleteFile: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [PostController],
      providers: [
        { provide: PostService, useValue: mockPostService },
        { provide: S3Service, useValue: mockS3Service },
      ],
    }).compile();

    controller = module.get<PostController>(PostController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('createPost', () => {
    it('should create a post successfully', async () => {
      const mockServiceResponse = {
        postId: 1,
        imageUrl: null,
      };

      const expectedResponse: PostCreateResponse = {
        statusCode: HttpStatus.CREATED,
        message: '게시물이 성공적으로 작성되었습니다.',
        postId: 1,
        imageUrl: null,
      };

      (mockPostService.createPost as jest.Mock).mockResolvedValue(
        mockServiceResponse,
      );

      const result = await controller.createPost(
        { user: { userId: 1 } },
        { content: 'Test content' },
        null,
      );

      expect(result).toEqual(expectedResponse);

      expect(mockPostService.createPost).toHaveBeenCalledWith(1, {
        content: 'Test content',
        imageUrl: null,
      });
    });

    it('should handle image upload when file is provided', async () => {
      const mockFile = {
        originalname: 'test image.jpg',
        size: 1024,
      } as Express.Multer.File;

      const mockImageUrl = 'https://example.com/image.jpg';

      (mockS3Service.uploadFile as jest.Mock).mockResolvedValue(mockImageUrl);

      (mockPostService.createPost as jest.Mock).mockResolvedValue({
        postId: 1,
        imageUrl: mockImageUrl,
      });

      const result = await controller.createPost(
        { user: { userId: 1 } },
        { content: 'Test content' },
        mockFile,
      );

      expect(result.imageUrl).toBe(mockImageUrl);

      expect(mockS3Service.uploadFile).toHaveBeenCalled();
    });

    it('should handle service errors', async () => {
      (mockPostService.createPost as jest.Mock).mockRejectedValue(
        new Error('Service error'),
      );

      await expect(
        controller.createPost(
          { user: { userId: 1 } },
          { content: 'Test content' },
          null,
        ),
      ).rejects.toThrow('Service error');
    });
  });

  describe('updatePost', () => {
    it('should update a post successfully', async () => {
      const expectedResponse: BaseResponse = {
        statusCode: HttpStatus.OK,
        message: '게시물이 성공적으로 수정되었습니다.',
      };

      (mockPostService.updatePost as jest.Mock).mockResolvedValue(undefined);

      const result = await controller.updatePost(
        { user: { userId: 1 } },
        1,
        { content: 'Updated content' },
        null,
      );

      expect(result).toEqual(expectedResponse);
    });

    it('should handle image update', async () => {
      const mockFile = {
        originalname: 'updated-image.jpg',
        size: 1024,
      } as Express.Multer.File;

      const mockImageUrl = 'https://example.com/updated-image.jpg';

      (mockS3Service.uploadFile as jest.Mock).mockResolvedValue(mockImageUrl);

      (mockPostService.updatePost as jest.Mock).mockResolvedValue(undefined);

      await controller.updatePost(
        { user: { userId: 1 } },
        1,
        { content: 'Updated content' },
        mockFile,
      );

      expect(mockPostService.updatePost).toHaveBeenCalledWith(1, 1, {
        content: 'Updated content',
        imageUrl: mockImageUrl,
      });
    });
  });

  describe('deletePost', () => {
    it('should delete a post successfully', async () => {
      const expectedResponse: BaseResponse = {
        statusCode: HttpStatus.OK,
        message: '게시물이 성공적으로 삭제되었습니다.',
      };

      (mockPostService.deletePost as jest.Mock).mockResolvedValue(undefined);

      const result = await controller.deletePost({ user: { userId: 1 } }, 1);
      expect(result).toEqual(expectedResponse);
      expect(mockPostService.deletePost).toHaveBeenCalledWith(1, 1);
    });
  });

  describe('likePost', () => {
    it('should like a post successfully', async () => {
      const mockServiceResponse = {
        isLiked: true,
        likeCount: 1,
      };

      const expectedResponse: PostLikeResponse = {
        statusCode: HttpStatus.OK,
        message: '게시물에 좋아요를 눌렀습니다.',
        likeCount: 1,
      };

      (mockPostService.likePost as jest.Mock).mockResolvedValue(
        mockServiceResponse,
      );

      const result = await controller.likePost({ user: { userId: 1 } }, 1);
      expect(result).toEqual(expectedResponse);
    });

    it('should unlike a post successfully', async () => {
      const mockServiceResponse = {
        isLiked: false,
        likeCount: 0,
      };

      const expectedResponse: PostLikeResponse = {
        statusCode: HttpStatus.OK,
        message: '게시물 좋아요를 취소했습니다.',
        likeCount: 0,
      };

      (mockPostService.likePost as jest.Mock).mockResolvedValue(
        mockServiceResponse,
      );

      const result = await controller.likePost({ user: { userId: 1 } }, 1);
      expect(result).toEqual(expectedResponse);
    });
  });
});
