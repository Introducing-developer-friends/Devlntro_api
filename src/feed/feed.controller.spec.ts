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

describe('FeedController', () => {
  let controller: FeedController;
  let feedService: FeedService;

  const mockFeedService = {
    getFeed: jest.fn(),
    getPostDetail: jest.fn(),
  };

  const mockRequest = {
    user: { userId: 1 },
  };

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
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    controller = module.get<FeedController>(FeedController);
    feedService = module.get<FeedService>(FeedService);

    jest.clearAllMocks();
  });

  describe('getFeed', () => {
    it('should return posts with default options', async () => {
      const query: FeedQueryDto = {
        sort: SortOption.LATEST,
        filter: FilterType.ALL,
      };
      jest.spyOn(feedService, 'getFeed').mockResolvedValue(mockPosts);

      const result = await controller.getFeed(mockRequest, query);

      expect(result).toEqual({
        statusCode: HttpStatus.OK,
        message: '피드를 성공적으로 조회했습니다.',
        posts: mockPosts,
      });

      expect(feedService.getFeed).toHaveBeenCalledWith(
        1,
        SortOption.LATEST,
        FilterType.ALL,
        undefined,
      );
    });

    it('should return posts sorted by likes', async () => {
      const query: FeedQueryDto = {
        sort: SortOption.LIKES,
        filter: FilterType.ALL,
      };
      const sortedPosts = [...mockPosts].sort(
        (a, b) => b.likesCount - a.likesCount,
      );
      jest.spyOn(feedService, 'getFeed').mockResolvedValue(sortedPosts);

      const result = await controller.getFeed(mockRequest, query);

      expect(result.statusCode).toBe(HttpStatus.OK);
      expect(result.posts).toEqual(sortedPosts);
      expect(feedService.getFeed).toHaveBeenCalledWith(
        1,
        SortOption.LIKES,
        FilterType.ALL,
        undefined,
      );
    });

    it('should return posts sorted by comments', async () => {
      const query: FeedQueryDto = {
        sort: SortOption.COMMENTS,
        filter: FilterType.ALL,
      };
      const sortedPosts = [...mockPosts].sort(
        (a, b) => b.commentsCount - a.commentsCount,
      );
      jest.spyOn(feedService, 'getFeed').mockResolvedValue(sortedPosts);

      const result = await controller.getFeed(mockRequest, query);

      expect(result.statusCode).toBe(HttpStatus.OK);
      expect(result.posts).toEqual(sortedPosts);
      expect(feedService.getFeed).toHaveBeenCalledWith(
        1,
        SortOption.COMMENTS,
        FilterType.ALL,
        undefined,
      );
    });

    it('should return own posts', async () => {
      const query: FeedQueryDto = {
        sort: SortOption.LATEST,
        filter: FilterType.OWN,
      };
      const ownPosts = mockPosts.filter((post) => post.isOwnPost);
      jest.spyOn(feedService, 'getFeed').mockResolvedValue(ownPosts);

      const result = await controller.getFeed(mockRequest, query);

      expect(result.statusCode).toBe(HttpStatus.OK);
      expect(result.posts).toEqual(ownPosts);
      expect(feedService.getFeed).toHaveBeenCalledWith(
        1,
        SortOption.LATEST,
        FilterType.OWN,
        undefined,
      );
    });

    it('should return specific user posts', async () => {
      const query: FeedQueryDto = {
        sort: SortOption.LATEST,
        filter: FilterType.SPECIFIC,
        specificUserId: 2,
      };
      jest.spyOn(feedService, 'getFeed').mockResolvedValue(mockPosts);

      const result = await controller.getFeed(mockRequest, query);

      expect(result.statusCode).toBe(HttpStatus.OK);
      expect(result.posts).toEqual(mockPosts);
      expect(feedService.getFeed).toHaveBeenCalledWith(
        1,
        SortOption.LATEST,
        FilterType.SPECIFIC,
        2,
      );
    });

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

      await expect(controller.getFeed(mockRequest, query)).rejects.toThrow(
        BadRequestException,
      );
      expect(feedService.getFeed).toHaveBeenCalledWith(
        1,
        SortOption.LATEST,
        FilterType.SPECIFIC,
        undefined,
      );
    });
  });

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

    it('should throw BadRequestException for invalid postId', async () => {
      jest
        .spyOn(feedService, 'getPostDetail')
        .mockRejectedValue(
          new BadRequestException('유효하지 않은 게시물 ID입니다.'),
        );

      await expect(controller.getPostDetail(mockRequest, null)).rejects.toThrow(
        BadRequestException,
      );
      expect(feedService.getPostDetail).toHaveBeenCalledWith(1, null);
    });

    it('should throw NotFoundException for non-existent post', async () => {
      jest
        .spyOn(feedService, 'getPostDetail')
        .mockRejectedValue(
          new NotFoundException('해당 게시물을 찾을 수 없습니다.'),
        );

      await expect(controller.getPostDetail(mockRequest, 999)).rejects.toThrow(
        NotFoundException,
      );
      expect(feedService.getPostDetail).toHaveBeenCalledWith(1, 999);
    });

    it('should handle service errors', async () => {
      jest
        .spyOn(feedService, 'getPostDetail')
        .mockRejectedValue(new Error('Unknown error'));

      await expect(controller.getPostDetail(mockRequest, 123)).rejects.toThrow(
        Error,
      );
      expect(feedService.getPostDetail).toHaveBeenCalledWith(1, 123);
    });
  });
});
