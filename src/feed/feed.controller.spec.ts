import { Test, TestingModule } from '@nestjs/testing';
import { FeedController } from './feed.controller';
import { FeedService } from './feed.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { FeedQueryDto } from '../dto/feed-query.dto';
import { BadRequestException, NotFoundException, HttpStatus  } from '@nestjs/common';
import { 
  FeedResponse, 
  PostDetailResponse, 
  SortOption, 
  FilterType,
  PostBasicInfo,
  PostDetailInfo 
} from '../types/feed.types';

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
    const mockPosts: PostBasicInfo[] = [
      {
        postId: 123,
        createrId: 456,
        createrName: '홍길동',
        createdAt: new Date('2024-09-18T12:34:56.000Z'),
        imageUrl: 'https://example.com/image.jpg',
        isOwnPost: true,
        likesCount: 10,
        commentsCount: 5,
      },
      {
        postId: 124,
        createrId: 789,
        createrName: '김철수',
        createdAt: new Date('2024-09-18T13:00:00.000Z'),
        imageUrl: 'https://example.com/image2.jpg',
        isOwnPost: false,
        likesCount: 3,
        commentsCount: 1,
      },
    ];

    // 기본 옵션으로 피드 목록을 반환하는 테스트
    it('should return a list of posts with default options', async () => {
      const req = { user: { userId: 1 } };
      const query: FeedQueryDto = { sort: SortOption.LATEST, filter: FilterType.ALL };

      jest.spyOn(feedService, 'getFeed').mockResolvedValue(mockPosts);

      const expectedResponse: FeedResponse = {
        statusCode: HttpStatus.OK,
        message: '피드를 성공적으로 조회했습니다.',
        posts: mockPosts
      };

      const result = await controller.getFeed(req as any, query);
      expect(result).toEqual(expectedResponse);
      expect(feedService.getFeed).toHaveBeenCalledWith(1, SortOption.LATEST, FilterType.ALL, undefined);
    });

    // 좋아요 순으로 정렬된 게시물 목록 반환 테스트
    it('should return posts sorted by likes', async () => {
      const req = { user: { userId: 1 } };
      const query: FeedQueryDto = { sort: SortOption.LIKES, filter: FilterType.ALL };

      jest.spyOn(feedService, 'getFeed').mockResolvedValue(mockPosts);

      const result = await controller.getFeed(req as any, query);
      expect(result.statusCode).toBe(HttpStatus.OK);
      expect(feedService.getFeed).toHaveBeenCalledWith(1, SortOption.LIKES, FilterType.ALL, undefined);
    });

    // 자신의 게시물 목록을 반환하는 테스트
    it('should return own posts', async () => {
      const req = { user: { userId: 1 } };
      const query: FeedQueryDto = { sort: SortOption.LATEST, filter: FilterType.OWN };

      jest.spyOn(feedService, 'getFeed').mockResolvedValue(mockPosts.filter(post => post.isOwnPost));

      const result = await controller.getFeed(req as any, query);
      expect(result.statusCode).toBe(HttpStatus.OK);
      expect(feedService.getFeed).toHaveBeenCalledWith(1, SortOption.LATEST, FilterType.OWN, undefined);
    });

    // 특정 사용자의 게시물 목록을 반환하는 테스트
    it('should return specific user posts', async () => {
      const req = { user: { userId: 1 } };
      const query: FeedQueryDto = { 
        sort: SortOption.LATEST, 
        filter: FilterType.SPECIFIC, 
        specificUserId: 2 
      };

      jest.spyOn(feedService, 'getFeed').mockResolvedValue(mockPosts);

      const result = await controller.getFeed(req as any, query);
      expect(result.statusCode).toBe(HttpStatus.OK);
      expect(feedService.getFeed).toHaveBeenCalledWith(1, SortOption.LATEST, FilterType.SPECIFIC, 2);
    });

    // 특정 사용자의 게시물 조회 시 specificUserId가 없는 경우 예외 발생 테스트
    it('should throw BadRequestException if specificUserId is missing for SPECIFIC filter', async () => {
      const req = { user: { userId: 1 } };
      const query: FeedQueryDto = { 
        sort: SortOption.LATEST, 
        filter: FilterType.SPECIFIC 
      };
  
      // getFeed가 호출되기 전에 예외를 발생시키도록 수정
      jest.spyOn(feedService, 'getFeed').mockImplementation(() => {
        throw new BadRequestException('specificUserId가 필요합니다.');
      });
  
      await expect(controller.getFeed(req as any, query))
        .rejects
        .toThrow(BadRequestException);
    });
  });

  // getPostDetail 메서드 테스트
  describe('getPostDetail', () => {
    const mockPostDetail: PostDetailInfo = {
      postId: 123,
      createrId: 456,
      createrName: '홍길동',
      createdAt: new Date('2024-09-18T12:34:56.000Z'),
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
          createdAt: new Date('2024-09-18T12:45:00.000Z'),
          likeCount: 5,
        }
      ],
      likes: [
        {
          userId: 789,
          userName: '김철수',
        }
      ]
    };

     // 게시물 상세 정보를 반환하는 테스트
    it('should return post detail', async () => {
      const req = { user: { userId: 1 } };
      
      jest.spyOn(feedService, 'getPostDetail').mockResolvedValue(mockPostDetail);

      const expectedResponse: PostDetailResponse = {
        statusCode: HttpStatus.OK,
        message: '게시물을 성공적으로 조회했습니다.',
        ...mockPostDetail
      };

      const result = await controller.getPostDetail(req as any, 123);
      expect(result).toEqual(expectedResponse);
      expect(feedService.getPostDetail).toHaveBeenCalledWith(1, 123);
    });

    // 유효하지 않은 postId로 예외 발생 테스트
    it('should throw BadRequestException if postId is invalid', async () => {
      const req = { user: { userId: 1 } };
      
      // getPostDetail이 호출되기 전에 예외를 발생시키도록 수정
      jest.spyOn(feedService, 'getPostDetail').mockImplementation(() => {
        throw new BadRequestException('유효하지 않은 게시물 ID입니다.');
      });
  
      await expect(controller.getPostDetail(req as any, null))
        .rejects
        .toThrow(BadRequestException);
    });

    // 게시물을 찾지 못했을 때 예외 발생 테스트
    it('should throw NotFoundException if post does not exist', async () => {
      const req = { user: { userId: 1 } };
      
      // getPostDetail 호출 시 예외를 던지도록 수정
      jest.spyOn(feedService, 'getPostDetail').mockImplementation(() => {
        throw new NotFoundException('해당 게시물을 찾을 수 없습니다.');
      });
  
      await expect(controller.getPostDetail(req as any, 123)) // 없는 게시물 ID로 예외 발생 확인
        .rejects
        .toThrow(NotFoundException); // NotFoundException이 발생해야 함
    });
  });
});
