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
import { NotFoundException } from '@nestjs/common';
import { SortOption } from '../dto/feed-query.dto';

// Mock repository 객체 설정
const mockRepository = () => ({
  createQueryBuilder: jest.fn(() => ({
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    getOne: jest.fn().mockResolvedValue(null), // getOne에 대한 mockResolvedValue 적용
  })),
});

// FeedFilterService와 SortingService의 mock 설정
const mockFeedFilterService = {
  filterPostsByUser: jest.fn(),
};

const mockSortingService = {
  sortPosts: jest.fn(),
};

describe('FeedService', () => {
  let feedService: FeedService;
  let postRepository: Repository<Post>;

  // 테스트 전 모듈 설정
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FeedService,
        {
          provide: getRepositoryToken(Post),
          useValue: mockRepository(),
        },
        {
          provide: getRepositoryToken(Comment),
          useValue: mockRepository(),
        },
        {
          provide: getRepositoryToken(PostLike),
          useValue: mockRepository(),
        },
        {
          provide: getRepositoryToken(CommentLike),
          useValue: mockRepository(),
        },
        {
          provide: FeedFilterService,
          useValue: mockFeedFilterService,
        },
        {
          provide: SortingService,
          useValue: mockSortingService,
        },
      ],
    }).compile();

    feedService = module.get<FeedService>(FeedService);
    postRepository = module.get<Repository<Post>>(getRepositoryToken(Post));
  });

  // getFeed 메서드 테스트
  describe('getFeed', () => {
    it('should return sorted feed posts', async () => {
      const mockPosts = [
        { post_id: 1, user: { user_id: 1, name: 'User1' }, post_like_count: 10, comments_count: 5, created_at: new Date(), image_url: 'url1' },
        { post_id: 2, user: { user_id: 2, name: 'User2' }, post_like_count: 5, comments_count: 3, created_at: new Date(), image_url: 'url2' },
      ];
      const sortedPosts = mockPosts; // 가상의 정렬된 게시물 리스트
      mockFeedFilterService.filterPostsByUser.mockResolvedValue(mockPosts); // 필터링된 게시물 목록 반환
      mockSortingService.sortPosts.mockReturnValue(sortedPosts); // 정렬된 게시물 목록 반환

      const result = await feedService.getFeed(1, SortOption.LATEST, 'all'); // feedService의 getFeed 호출

      // 반환된 결과가 예상된 형식인지 확인
      expect(result).toEqual({
        statusCode: 200,
        message: '피드를 성공적으로 조회했습니다.',
        posts: sortedPosts.map((post) => ({
          postId: post.post_id,
          createrId: post.user.user_id,
          createrName: post.user.name,
          createdAt: post.created_at,
          imageUrl: post.image_url,
          isOwnPost: post.user.user_id === 1,
          likesCount: post.post_like_count,
          commentsCount: post.comments_count,
        })),
      });

      // 서비스 호출 여부 확인
      expect(mockFeedFilterService.filterPostsByUser).toHaveBeenCalledWith(1, 'all', undefined);
      expect(mockSortingService.sortPosts).toHaveBeenCalledWith(mockPosts, SortOption.LATEST);
    });

    // getFeed 메서드에서 발생하는 에러 처리 테스트
    it('should handle errors when getting feed', async () => {
      mockFeedFilterService.filterPostsByUser.mockRejectedValue(new Error('Error in fetching feed'));

      // getFeed 호출 시 에러가 발생하는지 확인
      await expect(feedService.getFeed(1, SortOption.LATEST, 'all')).rejects.toThrow('Error in fetching feed');
    });
  });

  // getPostDetail 메서드 테스트
  describe('getPostDetail', () => {
    it('should return post details', async () => {
      const mockPost = {
        post_id: 123,
        user: { user_id: 1, name: 'User1' },
        created_at: new Date(),
        image_url: 'https://example.com/image.jpg',
        content: 'This is a post',
        postLikes: [{ userAccount: { user_id: 2, name: 'User2' } }],
        comments: [{ comment_id: 1, userAccount: { user_id: 3, name: 'User3' }, content: 'Nice post!', created_at: new Date(), like_count: 5 }],
      };

      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(mockPost), // 게시물 데이터를 getOne에서 반환
      };

      // QueryBuilder에 대한 모킹
      jest.spyOn(postRepository, 'createQueryBuilder').mockReturnValue(mockQueryBuilder as any);

      const result = await feedService.getPostDetail(1, 123);

      // 반환된 게시물 상세 데이터 확인
      expect(result).toEqual({
        statusCode: 200,
        message: '게시물을 성공적으로 조회했습니다.',
        postId: mockPost.post_id,
        createrId: mockPost.user.user_id,
        createrName: mockPost.user.name,
        createdAt: mockPost.created_at,
        imageUrl: mockPost.image_url,
        content: mockPost.content,
        likesCount: mockPost.postLikes.length,
        commentsCount: mockPost.comments.length,
        isOwnPost: mockPost.user.user_id === 1,
        comments: mockPost.comments.map(comment => ({
          commentId: comment.comment_id,
          authorId: comment.userAccount.user_id,
          authorName: comment.userAccount.name,
          content: comment.content,
          createdAt: comment.created_at,
          likeCount: comment.like_count,
        })),
        likes: mockPost.postLikes.map(like => ({
          userId: like.userAccount.user_id,
          userName: like.userAccount.name,
        })),
      });

      // QueryBuilder의 메서드 호출 여부 확인
      expect(postRepository.createQueryBuilder).toHaveBeenCalled();
      expect(mockQueryBuilder.getOne).toHaveBeenCalled();
    });

    // 게시물이 존재하지 않는 경우 예외 처리 테스트
    it('should throw NotFoundException if post does not exist', async () => {
      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(null), // 게시물 없음
      };

      // QueryBuilder에 대한 모킹
      jest.spyOn(postRepository, 'createQueryBuilder').mockReturnValue(mockQueryBuilder as any);

      // 게시물이 없을 때 NotFoundException 발생 여부 확인
      await expect(feedService.getPostDetail(1, 123)).rejects.toThrow(NotFoundException);
    });
  });
});
