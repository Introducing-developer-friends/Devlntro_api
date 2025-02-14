import { Test, TestingModule } from '@nestjs/testing';
import { FeedService } from './feed.service';
import { Repository } from 'typeorm';
import { Post } from '../../post/entity/post.entity';
import { Comment } from '../../comment/entity/comment.entity';
import { PostLike } from '../../post/entity/post-like.entity';
import { CommentLike } from '../../comment/entity/comment-like.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { FeedFilterService } from '../../services/feed-filter.service';
import { SortingService } from '../../services/sorting-service';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { PostBasicInfo } from '../../types/feed.types';
import { ErrorMessageType } from '../../enums/error.message.enum';
import { FilterType, SortOption } from '../../enums/sort.enum';

const createMockQueryBuilder = (returnValue) => ({
  leftJoin: jest.fn().mockReturnThis(),
  where: jest.fn().mockReturnThis(),
  andWhere: jest.fn().mockReturnThis(),
  select: jest.fn().mockReturnThis(),
  getOne: jest.fn().mockResolvedValue(returnValue),
});

describe('FeedService', () => {
  let feedService: FeedService;
  let postRepository: Repository<Post>;
  let feedFilterService: FeedFilterService;
  let sortingService: SortingService;

  const mockDate = new Date('2024-01-01');

  const mockPostEntity = {
    post_id: 1,
    user: {
      user_id: 1,
      name: 'User1',
      login_id: 'user1',
      password: 'password',
      confirm_password: 'password',
      deletedAt: null,
      currentTokenVersion: 1,

      contacts: [],
      contactOf: [],
      posts: [],
      comments: [],
      postLikes: [],
      sentFriendRequests: [],
      receivedFriendRequests: [],
      notifications: [],
      refreshTokens: [],
      profile: null,
    },
    content: 'Test content',
    created_at: mockDate,
    image_url: 'url1',
    post_like_count: 10,
    comments_count: 5,
    comments: [],
    postLikes: [],
  };

  const mockPostBasicInfo: PostBasicInfo = {
    postId: 1,
    createrId: 1,
    createrName: 'User1',
    createdAt: mockDate,
    imageUrl: 'url1',
    isOwnPost: true,
    likesCount: 10,
    commentsCount: 5,
  };

  const createMockRepository = () => ({
    createQueryBuilder: jest.fn(() => ({
      leftJoin: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      getOne: jest.fn().mockResolvedValue(null),
    })),
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FeedService,
        {
          provide: getRepositoryToken(Post),
          useValue: createMockRepository(),
        },
        {
          provide: getRepositoryToken(Comment),
          useValue: createMockRepository(),
        },
        {
          provide: getRepositoryToken(PostLike),
          useValue: createMockRepository(),
        },
        {
          provide: getRepositoryToken(CommentLike),
          useValue: createMockRepository(),
        },
        {
          provide: FeedFilterService,
          useValue: {
            filterPostsByUser: jest.fn(),
          },
        },
        {
          provide: SortingService,
          useValue: {
            sortPosts: jest.fn(),
          },
        },
      ],
    }).compile();

    feedService = module.get<FeedService>(FeedService);
    postRepository = module.get<Repository<Post>>(getRepositoryToken(Post));
    feedFilterService = module.get<FeedFilterService>(FeedFilterService);
    sortingService = module.get<SortingService>(SortingService);

    jest.clearAllMocks();
  });

  describe('getFeed', () => {
    it('should return sorted feed posts by latest', async () => {
      const mockPosts = [mockPostEntity];
      const expectedPosts = [mockPostBasicInfo];

      jest
        .spyOn(feedFilterService, 'filterPostsByUser')
        .mockResolvedValue(mockPosts);
      jest.spyOn(sortingService, 'sortPosts').mockReturnValue(expectedPosts);

      const result = await feedService.getFeed(
        1,
        SortOption.LATEST,
        FilterType.ALL,
      );

      expect(result).toEqual(expectedPosts);
      expect(feedFilterService.filterPostsByUser).toHaveBeenCalledWith(
        1,
        FilterType.ALL,
        undefined,
      );
    });

    it('should return sorted feed posts by likes', async () => {
      const mockPosts = [
        { ...mockPostEntity, post_id: 1, post_like_count: 20 },
        { ...mockPostEntity, post_id: 2, post_like_count: 10 },
      ];

      const expectedPosts = [
        { ...mockPostBasicInfo, postId: 1, likesCount: 20 },
        { ...mockPostBasicInfo, postId: 2, likesCount: 10 },
      ];

      jest
        .spyOn(feedFilterService, 'filterPostsByUser')
        .mockResolvedValue(mockPosts);
      jest.spyOn(sortingService, 'sortPosts').mockReturnValue(expectedPosts);

      const result = await feedService.getFeed(
        1,
        SortOption.LIKES,
        FilterType.ALL,
      );

      expect(result).toEqual(expectedPosts);
      expect(result[0].likesCount).toBeGreaterThan(result[1].likesCount);
    });

    it('should return sorted posts by comments count', async () => {
      const mockPosts = [
        { ...mockPostEntity, post_id: 1, comments_count: 15 },
        { ...mockPostEntity, post_id: 2, comments_count: 5 },
      ];

      const expectedPosts = [
        { ...mockPostBasicInfo, postId: 1, commentsCount: 15 },
        { ...mockPostBasicInfo, postId: 2, commentsCount: 5 },
      ];

      jest
        .spyOn(feedFilterService, 'filterPostsByUser')
        .mockResolvedValue(mockPosts);
      jest.spyOn(sortingService, 'sortPosts').mockReturnValue(expectedPosts);

      const result = await feedService.getFeed(
        1,
        SortOption.COMMENTS,
        FilterType.ALL,
      );

      expect(result).toEqual(expectedPosts);
      expect(result[0].commentsCount).toBeGreaterThan(result[1].commentsCount);
    });

    it('should handle empty feed result', async () => {
      jest.spyOn(feedFilterService, 'filterPostsByUser').mockResolvedValue([]);
      jest.spyOn(sortingService, 'sortPosts').mockReturnValue([]);

      const result = await feedService.getFeed(
        1,
        SortOption.LATEST,
        FilterType.ALL,
      );
      expect(result).toEqual([]);
    });

    it('should throw BadRequestException when specificUserId is required but missing', async () => {
      await expect(
        feedService.getFeed(1, SortOption.LATEST, FilterType.SPECIFIC),
      ).rejects.toThrow(
        new BadRequestException(
          '특정 사용자의 게시물을 조회하기 위해서는 specificUserId가 필요합니다.',
        ),
      );
    });

    it('should handle feed filter service errors', async () => {
      jest
        .spyOn(feedFilterService, 'filterPostsByUser')
        .mockRejectedValue(new Error('Filter service error'));

      await expect(
        feedService.getFeed(1, SortOption.LATEST, FilterType.ALL),
      ).rejects.toThrow(Error);
    });

    it('should handle feed filter service returning null', async () => {
      jest
        .spyOn(feedFilterService, 'filterPostsByUser')
        .mockRejectedValue(new Error('Failed to filter posts'));

      await expect(
        feedService.getFeed(1, SortOption.LATEST, FilterType.ALL),
      ).rejects.toThrow('Failed to filter posts');

      expect(sortingService.sortPosts).not.toHaveBeenCalled();
    });

    it('should pass correct parameters to sorting service', async () => {
      const mockPosts = [mockPostEntity];
      jest
        .spyOn(feedFilterService, 'filterPostsByUser')
        .mockResolvedValue(mockPosts);
      jest.spyOn(sortingService, 'sortPosts');

      await feedService.getFeed(1, SortOption.LIKES, FilterType.ALL);

      expect(sortingService.sortPosts).toHaveBeenCalledWith(
        mockPosts,
        SortOption.LIKES,
      );
    });
  });

  describe('getPostDetail', () => {
    it('should return post detail successfully', async () => {
      const mockDetailPost = {
        ...mockPostEntity,
        comments: [
          {
            comment_id: 1,
            content: 'Test comment',
            created_at: mockDate,
            like_count: 5,
            userAccount: {
              user_id: 2,
              name: 'Commenter',
            },
          },
        ],
        postLikes: [
          {
            userAccount: {
              user_id: 3,
              name: 'Liker',
            },
          },
        ],
      };

      const queryBuilder = createMockQueryBuilder(mockDetailPost);
      jest
        .spyOn(postRepository, 'createQueryBuilder')
        .mockReturnValue(queryBuilder as any);

      const result = await feedService.getPostDetail(1, 1);

      expect(result.postId).toBe(mockDetailPost.post_id);
      expect(result.comments).toHaveLength(1);
      expect(result.likes).toHaveLength(1);
    });

    it('should throw NotFoundException when post does not exist', async () => {
      const queryBuilder = createMockQueryBuilder(null);

      jest
        .spyOn(postRepository, 'createQueryBuilder')
        .mockReturnValue(queryBuilder as any);

      await expect(feedService.getPostDetail(1, 999)).rejects.toThrow(
        new NotFoundException(ErrorMessageType.NOT_FOUND_FEED),
      );
    });

    it('should handle database query errors', async () => {
      const queryBuilder = {
        leftJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        getOne: jest
          .fn()
          .mockRejectedValue(new Error('Database connection error')),
      };

      jest
        .spyOn(postRepository, 'createQueryBuilder')
        .mockReturnValue(queryBuilder as any);

      await expect(feedService.getPostDetail(1, 1)).rejects.toThrow(Error);
    });

    it('should handle post with no comments and likes', async () => {
      const mockEmptyPost = {
        ...mockPostEntity,
        comments: [],
        postLikes: [],
      };

      const queryBuilder = {
        leftJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(mockEmptyPost),
      };

      jest
        .spyOn(postRepository, 'createQueryBuilder')
        .mockReturnValue(queryBuilder as any);

      const result = await feedService.getPostDetail(1, 1);

      expect(result.comments).toHaveLength(0);
      expect(result.likes).toHaveLength(0);
    });

    it('should verify database query structure', async () => {
      const queryBuilder = {
        leftJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(mockPostEntity),
      };

      jest
        .spyOn(postRepository, 'createQueryBuilder')
        .mockReturnValue(queryBuilder as any);

      await feedService.getPostDetail(1, 1);

      expect(queryBuilder.leftJoin).toHaveBeenCalled();
      expect(queryBuilder.where).toHaveBeenCalledWith(
        'post.post_id = :postId',
        { postId: 1 },
      );
      expect(queryBuilder.andWhere).toHaveBeenCalledWith(
        'post.deleted_at IS NULL',
      );
    });

    it('should map post detail info correctly', async () => {
      const mockDetailPost = {
        ...mockPostEntity,
        comments: [
          {
            comment_id: 1,
            userAccount: {
              user_id: 2,
              name: 'Commenter',
            },
            content: 'Test comment',
            created_at: mockDate,
            like_count: 5,
          },
          {
            comment_id: 2,
            userAccount: {
              user_id: 3,
              name: 'Commenter2',
            },
            content: 'Another comment',
            created_at: mockDate,
            like_count: 3,
          },
        ],
        postLikes: [
          {
            userAccount: {
              user_id: 4,
              name: 'Liker1',
            },
          },
          {
            userAccount: {
              user_id: 5,
              name: 'Liker2',
            },
          },
        ],
      };

      const queryBuilder = {
        leftJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(mockDetailPost),
      };

      jest
        .spyOn(postRepository, 'createQueryBuilder')
        .mockReturnValue(queryBuilder as any);

      const result = await feedService.getPostDetail(1, 1);

      expect(result.postId).toBe(mockDetailPost.post_id);
      expect(result.createrId).toBe(mockDetailPost.user.user_id);
      expect(result.createrName).toBe(mockDetailPost.user.name);
      expect(result.comments).toHaveLength(2);
      expect(result.likes).toHaveLength(2);
      expect(result.comments[0]).toEqual({
        commentId: 1,
        authorId: 2,
        authorName: 'Commenter',
        content: 'Test comment',
        createdAt: mockDate,
        likeCount: 5,
      });
      expect(result.likes[0]).toEqual({
        userId: 4,
        userName: 'Liker1',
      });
    });

    it('should handle empty comments array correctly', async () => {
      const mockPostWithEmptyComments = {
        ...mockPostEntity,
        comments: [],
        postLikes: [{ userAccount: { user_id: 1, name: 'Liker' } }],
      };

      const queryBuilder = {
        leftJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(mockPostWithEmptyComments),
      };

      jest
        .spyOn(postRepository, 'createQueryBuilder')
        .mockReturnValue(queryBuilder as any);

      const result = await feedService.getPostDetail(1, 1);

      expect(result.comments).toEqual([]);
      expect(result.likes).toHaveLength(1);
    });

    it('should handle empty likes array correctly', async () => {
      const mockPostWithEmptyLikes = {
        ...mockPostEntity,
        comments: [
          {
            comment_id: 1,
            userAccount: { user_id: 2, name: 'Commenter' },
            content: 'Test',
            created_at: mockDate,
            like_count: 0,
          },
        ],
        postLikes: [],
      };

      const queryBuilder = {
        leftJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(mockPostWithEmptyLikes),
      };

      jest
        .spyOn(postRepository, 'createQueryBuilder')
        .mockReturnValue(queryBuilder as any);

      const result = await feedService.getPostDetail(1, 1);

      expect(result.comments).toHaveLength(1);
      expect(result.likes).toEqual([]);
    });

    it('should verify all required fields are selected in query', async () => {
      const queryBuilder = {
        leftJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(mockPostEntity),
      };

      jest
        .spyOn(postRepository, 'createQueryBuilder')
        .mockReturnValue(queryBuilder as any);

      await feedService.getPostDetail(1, 1);

      expect(queryBuilder.select).toHaveBeenCalledWith([
        'post.post_id',
        'post.content',
        'post.created_at',
        'post.image_url',
        'post.post_like_count',
        'post.comments_count',
        'user.user_id',
        'user.name',
        'comments.comment_id',
        'comments.content',
        'comments.created_at',
        'comments.like_count',
        'commentUser.user_id',
        'commentUser.name',
        'likes.post_like_id',
        'likes.created_at',
        'likeUser.user_id',
        'likeUser.name',
      ]);
    });
  });
});
