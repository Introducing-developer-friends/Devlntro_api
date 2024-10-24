import { Test, TestingModule } from '@nestjs/testing';
import { PostController } from './post.controller';
import { PostService } from './post.service';
import { S3Service } from '../s3/s3.service';
import { CreatePostDto, UpdatePostDto } from './dto/post.dto';
import { HttpStatus } from '@nestjs/common';
import { 
  PostCreateResponse,
  PostUpdateResponse,
  PostDeleteResponse,
  PostLikeResponse
} from '../types/post.types';

describe('PostController', () => {
  let controller: PostController;
  let mockPostService: Partial<PostService>;
  let mockS3Service: Partial<S3Service>;

  beforeEach(async () => {

    // PostService와 S3Service에 대한 모의 객체 생성
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

    // 테스트 모듈 설정
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PostController],
      providers: [
        { provide: PostService, useValue: mockPostService },
        { provide: S3Service, useValue: mockS3Service },
      ],
    }).compile();

    // PostController 인스턴스 가져오기
    controller = module.get<PostController>(PostController);
  });

  it('should be defined', () => {

    // 컨트롤러가 정의되었는지 확인
    expect(controller).toBeDefined();
  });

  describe('createPost', () => {
    it('should create a post successfully', async () => {

      // 모의 응답 설정
      const mockServiceResponse = {
        postId: 1,
        imageUrl: null
      };

      const expectedResponse: PostCreateResponse = {
        statusCode: HttpStatus.CREATED,
        message: '게시물이 성공적으로 작성되었습니다.',
        postId: 1,
        imageUrl: null
      };

      // PostService의 createPost 함수가 mockServiceResponse를 반환하도록 설정
      (mockPostService.createPost as jest.Mock).mockResolvedValue(mockServiceResponse);

      // createPost 함수 호출
      const result = await controller.createPost(
        { user: { userId: 1 } } as any,
        { content: 'Test content' } as CreatePostDto,
        null
      );
      
      // 결과가 예상 응답과 동일한지 확인
      expect(result).toEqual(expectedResponse);
      
      // createPost 함수가 올바른 인수로 호출되었는지 확인
      expect(mockPostService.createPost).toHaveBeenCalledWith(1, {
        content: 'Test content',
        imageUrl: null
      });
    });

    it('should handle image upload when file is provided', async () => {
      
      // 파일 업로드 테스트용 모의 파일
      const mockFile = {
        originalname: 'test image.jpg',
        size: 1024,
      } as Express.Multer.File;

      const mockImageUrl = 'https://example.com/image.jpg';

      // S3Service의 uploadFile 함수가 mockImageUrl을 반환하도록 설정
      (mockS3Service.uploadFile as jest.Mock).mockResolvedValue(mockImageUrl);
      
      // PostService의 createPost 함수가 모의 응답을 반환하도록 설정
      (mockPostService.createPost as jest.Mock).mockResolvedValue({
        postId: 1,
        imageUrl: mockImageUrl
      });

      // createPost 함수 호출
      const result = await controller.createPost(
        { user: { userId: 1 } } as any,
        { content: 'Test content' } as CreatePostDto,
        mockFile
      );

      // 결과가 예상대로 파일 URL을 포함하는지 확인
      expect(result.imageUrl).toBe(mockImageUrl);

      // S3Service의 uploadFile 함수가 호출되었는지 확인
      expect(mockS3Service.uploadFile).toHaveBeenCalled();
    });

    it('should handle service errors', async () => {

      // PostService의 createPost 함수가 에러를 던지도록 설정
      (mockPostService.createPost as jest.Mock).mockRejectedValue(new Error('Service error'));

      await expect(
        controller.createPost(
          { user: { userId: 1 } } as any,
          { content: 'Test content' } as CreatePostDto,
          null
        )
      ).rejects.toThrow('Service error');
    });
  });

  describe('updatePost', () => {
    it('should update a post successfully', async () => {
      const expectedResponse: PostUpdateResponse = {
        statusCode: HttpStatus.OK,
        message: '게시물이 성공적으로 수정되었습니다.'
      };

      (mockPostService.updatePost as jest.Mock).mockResolvedValue(undefined);

      // updatePost 함수 호출
      const result = await controller.updatePost(
        { user: { userId: 1 } } as any,
        1,
        { content: 'Updated content' } as UpdatePostDto,
        null
      );
      
      // 결과가 예상 응답과 동일한지 확인
      expect(result).toEqual(expectedResponse);
    });

    it('should handle image update', async () => {
      const mockFile = {
        originalname: 'updated-image.jpg',
        size: 1024,
      } as Express.Multer.File;

      const mockImageUrl = 'https://example.com/updated-image.jpg';

      // S3Service의 uploadFile 함수가 mockImageUrl을 반환하도록 설정
      (mockS3Service.uploadFile as jest.Mock).mockResolvedValue(mockImageUrl);
      
      // PostService의 updatePost 함수가 성공적으로 호출되도록 설정
      (mockPostService.updatePost as jest.Mock).mockResolvedValue(undefined);

      // updatePost 함수 호출
      await controller.updatePost(
        { user: { userId: 1 } } as any,
        1,
        { content: 'Updated content' } as UpdatePostDto,
        mockFile
      );

      expect(mockPostService.updatePost).toHaveBeenCalledWith(1, 1, {
        content: 'Updated content',
        imageUrl: mockImageUrl
      });
    });
  });

  describe('deletePost', () => {
    it('should delete a post successfully', async () => {
      const expectedResponse: PostDeleteResponse = {
        statusCode: HttpStatus.OK,
        message: '게시물이 성공적으로 삭제되었습니다.'
      };

      (mockPostService.deletePost as jest.Mock).mockResolvedValue(undefined);

      const result = await controller.deletePost({ user: { userId: 1 } } as any, 1);
      expect(result).toEqual(expectedResponse);
      expect(mockPostService.deletePost).toHaveBeenCalledWith(1, 1);
    });
  });

  describe('likePost', () => {
    it('should like a post successfully', async () => {
      const mockServiceResponse = {
        isLiked: true,
        likeCount: 1
      };

      const expectedResponse: PostLikeResponse = {
        statusCode: HttpStatus.OK,
        message: '게시물에 좋아요를 눌렀습니다.',
        likeCount: 1
      };

      (mockPostService.likePost as jest.Mock).mockResolvedValue(mockServiceResponse);

      const result = await controller.likePost({ user: { userId: 1 } } as any, 1);
      expect(result).toEqual(expectedResponse);
    });

    it('should unlike a post successfully', async () => {
      const mockServiceResponse = {
        isLiked: false,
        likeCount: 0
      };

      const expectedResponse: PostLikeResponse = {
        statusCode: HttpStatus.OK,
        message: '게시물 좋아요를 취소했습니다.',
        likeCount: 0
      };

      (mockPostService.likePost as jest.Mock).mockResolvedValue(mockServiceResponse);

      const result = await controller.likePost({ user: { userId: 1 } } as any, 1);
      expect(result).toEqual(expectedResponse);
    });
  });
});