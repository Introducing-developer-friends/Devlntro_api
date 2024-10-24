import { Test, TestingModule } from '@nestjs/testing';
import { FeedService } from './feed.service';
import { Repository } from 'typeorm';
import { Post } from '../entities/post.entity';
import { Comment } from '../entities/comment.entity';
import { PostLike } from '../entities/post-like.entity';
import { CommentLike } from '../entities/comment-like.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { FeedFilterService } from '../services/feed-filter.service';
import { SortingService } from '../services/sorting-service';
import { BadRequestException } from '@nestjs/common';
import { 
  SortOption,
  FilterType 
} from '../types/feed.types';

describe('FeedService', () => {
  let feedService: FeedService;
  let postRepository: Repository<Post>;
  let feedFilterService: FeedFilterService;
  let sortingService: SortingService;

  const mockDate = new Date('2024-01-01'); // 테스트용 mock 날짜

  const mockPostBasicData = {
    post_id: 1,
    user: { 
      user_id: 1, 
      name: 'User1',
    },
    content: 'Test content',
    created_at: mockDate,
    image_url: 'url1',
    post_like_count: 10,
    comments_count: 5,
  };

  // 모킹된 레포지토리 객체 생성 함수
  const createMockRepository = () => ({
    createQueryBuilder: jest.fn(() => ({
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
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
  });

  // getFeed 메서드에 대한 테스트
  describe('getFeed', () => {
    it('should return sorted feed posts by latest', async () => {
      const mockPosts = [{ ...mockPostBasicData }];

      jest.spyOn(feedFilterService, 'filterPostsByUser').mockResolvedValue(mockPosts as Post[]);
      jest.spyOn(sortingService, 'sortPosts').mockReturnValue(mockPosts as Post[]);

      const result = await feedService.getFeed(1, SortOption.LATEST, FilterType.ALL);

      expect(result).toEqual([{
        postId: 1,
        createrId: 1,
        createrName: 'User1',
        createdAt: mockDate,
        imageUrl: 'url1',
        isOwnPost: true,
        likesCount: 10,
        commentsCount: 5,
      }]);
      expect(sortingService.sortPosts).toHaveBeenCalledWith(mockPosts, SortOption.LATEST);
    });

    it('should return sorted feed posts by likes', async () => {
      const mockPosts = [
        { ...mockPostBasicData, post_id: 1, post_like_count: 20 },
        { ...mockPostBasicData, post_id: 2, post_like_count: 10 }
      ];

      jest.spyOn(feedFilterService, 'filterPostsByUser').mockResolvedValue(mockPosts as Post[]);
      jest.spyOn(sortingService, 'sortPosts').mockReturnValue(mockPosts as Post[]);

      const result = await feedService.getFeed(1, SortOption.LIKES, FilterType.ALL);

      expect(result).toHaveLength(2);
      expect(result[0].likesCount).toBeGreaterThan(result[1].likesCount);
      expect(sortingService.sortPosts).toHaveBeenCalledWith(mockPosts, SortOption.LIKES);
    });

    it('should return own posts', async () => {
      const mockPosts = [{ ...mockPostBasicData }];

      jest.spyOn(feedFilterService, 'filterPostsByUser').mockResolvedValue(mockPosts as Post[]);
      jest.spyOn(sortingService, 'sortPosts').mockReturnValue(mockPosts as Post[]);

      const result = await feedService.getFeed(1, SortOption.LATEST, FilterType.OWN);

      expect(result[0].isOwnPost).toBe(true);
      expect(feedFilterService.filterPostsByUser).toHaveBeenCalledWith(1, FilterType.OWN, undefined);
    });

    it('should throw BadRequestException when specificUserId is required but missing', async () => {
      await expect(
        feedService.getFeed(1, SortOption.LATEST, FilterType.SPECIFIC)
      ).rejects.toThrow(new BadRequestException('잘못된 요청입니다. specificUserId가 필요합니다.'));
    });
  });

  // getPostDetail 메서드에 대한 테스트
  describe('getPostDetail', () => {
    it('should return complete post details', async () => {
      const mockPost = {
        ...mockPostBasicData,
        comments: [
          {
            comment_id: 1,
            userAccount: { user_id: 2, name: 'User2' },
            content: 'Nice post!',
            created_at: mockDate,
            like_count: 5
          }
        ],
        postLikes: [
          {
            userAccount: { user_id: 2, name: 'User2' }
          }
        ]
      } as unknown as Post;

      const queryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(mockPost),
      };

      jest.spyOn(postRepository, 'createQueryBuilder')
        .mockReturnValue(queryBuilder as any);

      const result = await feedService.getPostDetail(1, 1);

      expect(result).toEqual({
        postId: 1,
        createrId: 1,
        createrName: 'User1',
        createdAt: mockDate,
        imageUrl: 'url1',
        content: 'Test content',
        likesCount: 10,
        commentsCount: 5,
        isOwnPost: true,
        comments: [
          {
            commentId: 1,
            authorId: 2,
            authorName: 'User2',
            content: 'Nice post!',
            createdAt: mockDate,
            likeCount: 5
          }
        ],
        likes: [
          {
            userId: 2,
            userName: 'User2'
          }
        ]
      });// 반환된 게시물 상세 정보가 예상과 동일한지 확인

      // 필요한 select 문이 호출되었는지 확인
      expect(queryBuilder.select).toHaveBeenCalledWith([
        'post',
        'user.user_id',
        'user.name',
        'comments',
        'commentUser.user_id',
        'commentUser.name',
        'likes',
        'likeUser.user_id',
        'likeUser.name'
      ]);
    }); 

    // 댓글이 없는 게시물의 상세 정보를 반환하는 테스트
    it('should handle post without comments', async () => {
      const mockPost = {
        ...mockPostBasicData,
        comments: [],
        postLikes: []
      } as unknown as Post;

      const queryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(mockPost),
      };

      jest.spyOn(postRepository, 'createQueryBuilder')
        .mockReturnValue(queryBuilder as any);

      const result = await feedService.getPostDetail(1, 1);

      expect(result.comments).toEqual([]);
      expect(result.likes).toEqual([]);
    });

    // 모든 필수 조인(join)이 올바르게 실행되었는지 확인하는 테스트
    it('should verify all required joins', async () => {
      const mockPostWithEmptyArrays = {
        ...mockPostBasicData,
        comments: [],   // 빈 배열로 초기화
        postLikes: [],  // 빈 배열로 초기화
      };
    
      const queryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(mockPostWithEmptyArrays as unknown as Post),
      };
    
      jest.spyOn(postRepository, 'createQueryBuilder')
        .mockReturnValue(queryBuilder as any);
    
      await feedService.getPostDetail(1, 1);
    
      // 모든 필수 join이 호출되었는지 확인
      expect(queryBuilder.leftJoinAndSelect).toHaveBeenCalledWith('post.user', 'user');
      expect(queryBuilder.leftJoinAndSelect).toHaveBeenCalledWith('post.comments', 'comments');
      expect(queryBuilder.leftJoinAndSelect).toHaveBeenCalledWith('comments.userAccount', 'commentUser');
      expect(queryBuilder.leftJoinAndSelect).toHaveBeenCalledWith('post.postLikes', 'likes');
      expect(queryBuilder.leftJoinAndSelect).toHaveBeenCalledWith('likes.userAccount', 'likeUser');
    });

    // 게시물을 찾지 못했을 때 예외 처리 테스트
    it('should throw error when post not found', async () => {
      const queryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(undefined),
      };

      jest.spyOn(postRepository, 'createQueryBuilder')
        .mockReturnValue(queryBuilder as any);

      await expect(feedService.getPostDetail(1, 999))
        .rejects
        .toThrow();
    });
  });
});