import { Test, TestingModule } from '@nestjs/testing';
import { PostController } from './post.controller';
import { PostService } from './post.service';
import { S3Service } from '../s3/s3.service';
import { CreatePostDto, UpdatePostDto } from './dto/post.dto';

describe('PostController', () => {
  let controller: PostController;
  let mockPostService: Partial<PostService>;
  let mockS3Service: Partial<S3Service>;

  // 각 테스트 실행 전에 mock 서비스 및 컨트롤러 설정
  beforeEach(async () => {
    mockPostService = {
      createPost: jest.fn(),
      updatePost: jest.fn(),
      deletePost: jest.fn(),
      likePost: jest.fn(),
    };

    // S3Service의 메서드를 모킹하여 사용할 수 있도록 설정
    mockS3Service = {
      uploadFile: jest.fn(),
      deleteFile: jest.fn(),
    };

    // 테스트 모듈 생성
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PostController],
      providers: [
        { provide: PostService, useValue: mockPostService },
        { provide: S3Service, useValue: mockS3Service },
      ],
    }).compile();

    // 컨트롤러 인스턴스 가져오기
    controller = module.get<PostController>(PostController);
  });

  // 컨트롤러 정의 테스트
  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  // createPost 메서드에 대한 테스트
  describe('createPost', () => {
    it('should create a post successfully', async () => {

      // PostService.createPost 메서드의 반환값 모킹
      const mockResponse = { statusCode: 201, message: '게시물이 성공적으로 작성되었습니다.', postId: 1, imageUrl: null };
      (mockPostService.createPost as jest.Mock).mockResolvedValue(mockResponse);

      // createPost 메서드 호출
      const result = await controller.createPost({ user: { userId: 1 } } as any, { content: 'Test content' } as CreatePostDto, null);
      
      // 결과가 예상된 응답과 일치하는지 확인
      expect(result).toEqual(mockResponse);
    });

    // 서비스 에러 처리 테스트
    it('should handle service errors', async () => {
      (mockPostService.createPost as jest.Mock).mockRejectedValue(new Error('Service error'));

      await expect(
        controller.createPost({ user: { userId: 1 } } as any, { content: 'Test content' } as CreatePostDto, null)
      ).rejects.toThrow(Error);
    });
  });

  // updatePost 메서드에 대한 테스트
  describe('updatePost', () => {
    it('should update a post successfully', async () => {
      const mockResponse = { statusCode: 200, message: '게시물이 성공적으로 수정되었습니다.' };
      (mockPostService.updatePost as jest.Mock).mockResolvedValue(mockResponse);

      // updatePost 메서드 호출
      const result = await controller.updatePost({ user: { userId: 1 } } as any, 1, { content: 'Updated content' } as UpdatePostDto, null);
      
      // 결과가 예상된 응답과 일치하는지 확인
      expect(result).toEqual(mockResponse);
    });

    // 업데이트 시 NotFound 에러 처리 테스트
    it('should handle not found error', async () => {

      // PostService.updatePost 메서드가 "Not found" 에러를 발생시키도록 설정
      (mockPostService.updatePost as jest.Mock).mockRejectedValue(new Error('Not found'));

      // 에러 발생 여부 확인
      await expect(
        controller.updatePost({ user: { userId: 1 } } as any, 1, { content: 'Updated content' } as UpdatePostDto, null)
      ).rejects.toThrow(Error);
    });
  });

  // deletePost 메서드에 대한 테스트
  describe('deletePost', () => {
    it('should delete a post successfully', async () => {
      
      // PostService.deletePost 메서드의 반환값 모킹
      const mockResponse = { statusCode: 200, message: '게시물이 성공적으로 삭제되었습니다.' };
      (mockPostService.deletePost as jest.Mock).mockResolvedValue(mockResponse);

      // deletePost 메서드 호출
      const result = await controller.deletePost({ user: { userId: 1 } } as any, 1);
      expect(result).toEqual(mockResponse);
    });
  });

  // likePost 메서드에 대한 테스트
  describe('likePost', () => {
    it('should like a post successfully', async () => {
      const mockResponse = { statusCode: 200, message: '게시물에 좋아요를 눌렀습니다.', likeCount: 1 };
      (mockPostService.likePost as jest.Mock).mockResolvedValue(mockResponse);

      // likePost 메서드 호출
      const result = await controller.likePost({ user: { userId: 1 } } as any, 1);
      
      // 결과가 예상된 응답과 일치하는지 확인
      expect(result).toEqual(mockResponse);
    });
  });
});
