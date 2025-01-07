import { Test, TestingModule } from '@nestjs/testing';
import { FeedController } from './feed.controller';
import { FeedService } from './feed.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { FeedQueryDto } from '../dto/feed-query.dto';
import {
  BadRequestException,
  NotFoundException,
  HttpStatus,
} from '@nestjs/common';
import {
  SortOption,
  FilterType,
  PostBasicInfo,
  PostDetailInfo,
} from '../types/feed.types';

// FeedController 테스트를 위한 기본 설정
// FeedService의 getFeed 및 getPostDetail 메서드를 mock 처리하여 테스트 대상에서 의존성을 분리.
describe('FeedController', () => {
  let controller: FeedController;
  let feedService: FeedService;

  // FeedService에 대한 Mock 구현체를 생성.
  const mockFeedService = {
    getFeed: jest.fn(),
    getPostDetail: jest.fn(),
  };

  // Mock 요청 객체. 요청에서 user 정보를 제공하기 위해 사용.
  const mockRequest = {
    user: { userId: 1 },
  };

  // Mock 데이터: 게시물 리스트.
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

  // Mock 데이터: 게시물 상세 정보.
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
      },
    ],
    likes: [
      {
        userId: 789,
        userName: '김철수',
      },
    ],
  };

  // 각 테스트 전에 실행되는 설정 단계.
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
      // JwtAuthGuard를 mock 처리하여 항상 인증 성공으로 가정.
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    // 테스트 대상 컨트롤러와 서비스를 주입받음.
    controller = module.get<FeedController>(FeedController);
    feedService = module.get<FeedService>(FeedService);

    // 각 테스트 사이에 mock 함수 호출 기록 초기화.
    jest.clearAllMocks();
  });

  // getFeed 메서드 테스트
  describe('getFeed', () => {
    // 기본 옵션으로 게시물을 성공적으로 조회하는 경우
    it('should return posts with default options', async () => {
      const query: FeedQueryDto = {
        sort: SortOption.LATEST,
        filter: FilterType.ALL,
      };
      jest.spyOn(feedService, 'getFeed').mockResolvedValue(mockPosts);

      const result = await controller.getFeed(mockRequest as any, query);

      // 기대값: 상태 코드와 메시지, 게시물 리스트
      expect(result).toEqual({
        statusCode: HttpStatus.OK,
        message: '피드를 성공적으로 조회했습니다.',
        posts: mockPosts,
      });
      // FeedService의 getFeed가 올바른 인자로 호출되었는지 확인
      expect(feedService.getFeed).toHaveBeenCalledWith(
        1,
        SortOption.LATEST,
        FilterType.ALL,
        undefined,
      );
    });

    // 좋아요 수 기준으로 정렬된 게시물을 조회하는 경우
    it('should return posts sorted by likes', async () => {
      const query: FeedQueryDto = {
        sort: SortOption.LIKES,
        filter: FilterType.ALL,
      };
      const sortedPosts = [...mockPosts].sort(
        (a, b) => b.likesCount - a.likesCount,
      );
      jest.spyOn(feedService, 'getFeed').mockResolvedValue(sortedPosts);

      const result = await controller.getFeed(mockRequest as any, query);

      expect(result.statusCode).toBe(HttpStatus.OK);
      expect(result.posts).toEqual(sortedPosts);
      expect(feedService.getFeed).toHaveBeenCalledWith(
        1,
        SortOption.LIKES,
        FilterType.ALL,
        undefined,
      );
    });

    // 댓글 수 기준으로 정렬된 게시물을 조회하는 경우
    it('should return posts sorted by comments', async () => {
      const query: FeedQueryDto = {
        sort: SortOption.COMMENTS,
        filter: FilterType.ALL,
      };
      const sortedPosts = [...mockPosts].sort(
        (a, b) => b.commentsCount - a.commentsCount,
      );
      jest.spyOn(feedService, 'getFeed').mockResolvedValue(sortedPosts);

      const result = await controller.getFeed(mockRequest as any, query);

      expect(result.statusCode).toBe(HttpStatus.OK);
      expect(result.posts).toEqual(sortedPosts);
      expect(feedService.getFeed).toHaveBeenCalledWith(
        1,
        SortOption.COMMENTS,
        FilterType.ALL,
        undefined,
      );
    });

    // 자신의 게시물만 조회하는 경우
    it('should return own posts', async () => {
      const query: FeedQueryDto = {
        sort: SortOption.LATEST,
        filter: FilterType.OWN,
      };
      const ownPosts = mockPosts.filter((post) => post.isOwnPost);
      jest.spyOn(feedService, 'getFeed').mockResolvedValue(ownPosts);

      const result = await controller.getFeed(mockRequest as any, query);

      expect(result.statusCode).toBe(HttpStatus.OK);
      expect(result.posts).toEqual(ownPosts);
      expect(feedService.getFeed).toHaveBeenCalledWith(
        1,
        SortOption.LATEST,
        FilterType.OWN,
        undefined,
      );
    });

    // 특정 사용자 게시물만 조회하는 경우
    it('should return specific user posts', async () => {
      const query: FeedQueryDto = {
        sort: SortOption.LATEST,
        filter: FilterType.SPECIFIC,
        specificUserId: 2,
      };
      jest.spyOn(feedService, 'getFeed').mockResolvedValue(mockPosts);

      const result = await controller.getFeed(mockRequest as any, query);

      expect(result.statusCode).toBe(HttpStatus.OK);
      expect(result.posts).toEqual(mockPosts);
      expect(feedService.getFeed).toHaveBeenCalledWith(
        1,
        SortOption.LATEST,
        FilterType.SPECIFIC,
        2,
      );
    });

    // SPECIFIC 필터에서 specificUserId가 누락된 경우 예외 처리
    it('should throw BadRequestException if specificUserId is missing for SPECIFIC filter', async () => {
      const query: FeedQueryDto = {
        sort: SortOption.LATEST,
        filter: FilterType.SPECIFIC,
      };
      jest
        .spyOn(feedService, 'getFeed')
        .mockRejectedValue(
          new BadRequestException('specificUserId가 필요합니다.'),
        );

      await expect(
        controller.getFeed(mockRequest as any, query),
      ).rejects.toThrow(BadRequestException);
      expect(feedService.getFeed).toHaveBeenCalledWith(
        1,
        SortOption.LATEST,
        FilterType.SPECIFIC,
        undefined,
      );
    });
  });

  // getPostDetail 메서드 테스트
  describe('getPostDetail', () => {
    it('should return post detail successfully', async () => {
      jest
        .spyOn(feedService, 'getPostDetail')
        .mockResolvedValue(mockPostDetail);

      const result = await controller.getPostDetail(mockRequest as any, 123);

      expect(result).toEqual({
        statusCode: HttpStatus.OK,
        message: '게시물을 성공적으로 조회했습니다.',
        ...mockPostDetail,
      });
      expect(feedService.getPostDetail).toHaveBeenCalledWith(1, 123);
    });

    // 유효하지 않은 postId에 대해 예외 처리
    it('should throw BadRequestException for invalid postId', async () => {
      jest
        .spyOn(feedService, 'getPostDetail')
        .mockRejectedValue(
          new BadRequestException('유효하지 않은 게시물 ID입니다.'),
        );

      await expect(
        controller.getPostDetail(mockRequest as any, null),
      ).rejects.toThrow(BadRequestException);
      expect(feedService.getPostDetail).toHaveBeenCalledWith(1, null);
    });

    // 존재하지 않는 게시물에 대해 예외 처리
    it('should throw NotFoundException for non-existent post', async () => {
      jest
        .spyOn(feedService, 'getPostDetail')
        .mockRejectedValue(
          new NotFoundException('해당 게시물을 찾을 수 없습니다.'),
        );

      await expect(
        controller.getPostDetail(mockRequest as any, 999),
      ).rejects.toThrow(NotFoundException);
      expect(feedService.getPostDetail).toHaveBeenCalledWith(1, 999);
    });

    // 서비스에서 알 수 없는 오류가 발생했을 경우 예외 처리
    it('should handle service errors', async () => {
      jest
        .spyOn(feedService, 'getPostDetail')
        .mockRejectedValue(new Error('Unknown error'));

      await expect(
        controller.getPostDetail(mockRequest as any, 123),
      ).rejects.toThrow(Error);
      expect(feedService.getPostDetail).toHaveBeenCalledWith(1, 123);
    });
  });
});
