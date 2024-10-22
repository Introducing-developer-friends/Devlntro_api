import { Test, TestingModule } from '@nestjs/testing';
import { FeedController } from './feed.controller';
import { FeedService } from './feed.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { FeedQueryDto, FilterType, SortOption } from '../dto/feed-query.dto';
import { BadRequestException, NotFoundException } from '@nestjs/common';

// FeedService의 mock 객체
const mockFeedService = {
  getFeed: jest.fn(),
  getPostDetail: jest.fn(),
};

describe('FeedController', () => {
  let controller: FeedController;
  let feedService: FeedService;

  // 각 테스트 전에 모듈 설정
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FeedController],
      providers: [
        {
          provide: FeedService,
          useValue: mockFeedService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: jest.fn(() => true) }) // JwtAuthGuard 무시
      .compile();

    controller = module.get<FeedController>(FeedController);
    feedService = module.get<FeedService>(FeedService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined(); // 컨트롤러가 정의되어 있는지 확인
  });

  // getFeed 메서드 테스트
  describe('getFeed', () => {
    it('should return a list of posts', async () => {
      const req = { user: { userId: 1 } }; // 요청 객체에서 사용자 ID 설정
      const query: FeedQueryDto = { filter: FilterType.ALL, sort: SortOption.LATEST }; // 피드 쿼리 설정
      const mockFeedResponse = {
        statusCode: 200,
        message: '피드를 성공적으로 조회했습니다.',
        posts: [
          {
            postId: 123,
            createrId: 456,
            createrName: '홍길동',
            createdAt: '2024-09-18T12:34:56.000Z',
            imageUrl: 'https://example.com/image.jpg',
            isOwnPost: true,
            likesCount: 10,
            commentsCount: 5,
          },
          {
            postId: 124,
            createrId: 789,
            createrName: '김철수',
            createdAt: '2024-09-18T13:00:00.000Z',
            imageUrl: 'https://example.com/image2.jpg',
            isOwnPost: false,
            likesCount: 3,
            commentsCount: 1,
          },
        ],
      };
      

      jest.spyOn(feedService, 'getFeed').mockResolvedValue(mockFeedResponse);

      const result = await controller.getFeed(req as any, query); // 컨트롤러의 getFeed 호출
      expect(result).toEqual(mockFeedResponse);
      expect(feedService.getFeed).toHaveBeenCalledWith(1, SortOption.LATEST, FilterType.ALL, undefined);
    });

    // 특정 사용자 ID가 없을 때 예외 처리 테스트
    it('should throw BadRequestException if specificUserId is missing for filter "specific"', async () => {
      const req = { user: { userId: 1 } };
      const query: FeedQueryDto = { filter: FilterType.SPECIFIC };

      await expect(controller.getFeed(req as any, query)).rejects.toThrow(BadRequestException);
    });
  });

  // getPostDetail 메서드 테스트
  describe('getPostDetail', () => {
    it('should return post detail', async () => {
      const req = { user: { userId: 1 } };
      const mockPostDetail = {
        statusCode: 200,
        message: '게시물을 성공적으로 조회했습니다.',
        postId: 123,
        createrId: 456,
        createrName: '홍길동',
        createdAt: new Date(),
        imageUrl: 'https://example.com/image.jpg',
        content: '이 게시물의 내용입니다.',
        likesCount: 42,
        commentsCount: 10,
        isOwnPost: true,
        comments: [
          {
            commentId: 1,
            authorId: 2,
            authorName: '김철수',
            content: '멋진 게시물이네요!',
            createdAt: new Date(),
            likeCount: 5,
          },
        ],
        likes: [
          {
            userId: 789,
            userName: '김철수',
          },
        ],
      };
  
      jest.spyOn(feedService, 'getPostDetail').mockResolvedValue(mockPostDetail);
  
      const result = await controller.getPostDetail(req as any, 123); // 컨트롤러의 getPostDetail 호출
      expect(result).toEqual(mockPostDetail); // 결과가 예상된 형식과 일치하는지 확인
      expect(feedService.getPostDetail).toHaveBeenCalledWith(1, 123); // 서비스 메서드 호출 확인
    });
    
    // postId가 유효하지 않은 경우 예외 처리 테스트
    it('should throw BadRequestException if postId is invalid', async () => {
      const req = { user: { userId: 1 } }; // 요청 객체
  
      await expect(controller.getPostDetail(req as any, null)).rejects.toThrow(BadRequestException);
    });
    
    // 게시물이 존재하지 않는 경우 예외 처리 테스트
    it('should throw NotFoundException if post does not exist', async () => {
      const req = { user: { userId: 1 } };
  
      jest.spyOn(feedService, 'getPostDetail').mockResolvedValue(null);
  
      await expect(controller.getPostDetail(req as any, 123)).rejects.toThrow(NotFoundException);
    });
  });
  
});
