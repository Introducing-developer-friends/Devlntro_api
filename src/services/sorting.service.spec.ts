import { Test, TestingModule } from '@nestjs/testing';
import { SortingService } from './sorting-service';
import { SortOption } from '../types/feed.types';
import { Post } from '../entities/post.entity';

describe('SortingService', () => {
  let service: SortingService;

  // Mock된 게시물 데이터 생성
  const mockDate1 = new Date('2024-09-19T12:00:00.000Z');
  const mockDate2 = new Date('2024-09-18T12:00:00.000Z');
  const mockDate3 = new Date('2024-09-17T12:00:00.000Z');

  const mockPosts: Post[] = [
    {
      post_id: 1,
      user: { user_id: 1, name: 'User1' },
      content: 'test1',
      created_at: mockDate2,
      image_url: 'test1.jpg',
      post_like_count: 10,
      comments_count: 5,
      comments: [],
      postLikes: []
    } as Post,
    {
      post_id: 2,
      user: { user_id: 2, name: 'User2' },
      content: 'test2',
      created_at: mockDate3,
      image_url: 'test2.jpg',
      post_like_count: 3,
      comments_count: 10,
      comments: [],
      postLikes: []
    } as Post,
    {
      post_id: 3,
      user: { user_id: 3, name: 'User3' },
      content: 'test3',
      created_at: mockDate1,
      image_url: 'test3.jpg',
      post_like_count: 20,
      comments_count: 2,
      comments: [],
      postLikes: []
    } as Post,
  ];

  // 서비스 초기화
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SortingService],
    }).compile();

    service = module.get<SortingService>(SortingService);
  });

  // sortPosts 메서드 테스트
  describe('sortPosts', () => {
    it('should sort posts by likes in descending order', () => {
      const sorted = service.sortPosts(mockPosts, SortOption.LIKES);
      
      expect(sorted[0].likesCount).toBe(20);
      expect(sorted[1].likesCount).toBe(10);
      expect(sorted[2].likesCount).toBe(3);

      // 데이터 변환 검증
      expect(sorted[0]).toEqual({
        postId: 3,
        createrId: 3,
        createrName: 'User3',
        createdAt: mockDate1,
        imageUrl: 'test3.jpg',
        isOwnPost: false,
        likesCount: 20,
        commentsCount: 2
      });
    });

    // 댓글 수 순 정렬 테스트
    it('should sort posts by comments in descending order', () => {
      const sorted = service.sortPosts(mockPosts, SortOption.COMMENTS);
      
      expect(sorted[0].commentsCount).toBe(10);
      expect(sorted[1].commentsCount).toBe(5);
      expect(sorted[2].commentsCount).toBe(2);
    });

    // 최신순 정렬 테스트
    it('should sort posts by latest in descending order', () => {
      const sorted = service.sortPosts(mockPosts, SortOption.LATEST);
      
      expect(sorted[0].createdAt).toEqual(mockDate1);
      expect(sorted[1].createdAt).toEqual(mockDate2);
      expect(sorted[2].createdAt).toEqual(mockDate3);
    });

    // 빈 입력 처리 테스트
    it('should handle empty input', () => {
      const sorted = service.sortPosts([], SortOption.LATEST);
      expect(sorted).toEqual([]);
    });

    // null 값 처리 테스트
    it('should handle null counts and dates', () => {
      const postsWithNull = [{
        ...mockPosts[0],
        post_like_count: null,
        comments_count: null,
        created_at: null
      }] as Post[];

      // null 값이 기본 값으로 대체되어 반환되는지 확인
      const sorted = service.sortPosts(postsWithNull, SortOption.LIKES);
      expect(sorted[0].likesCount).toBe(0);
      expect(sorted[0].commentsCount).toBe(0);
    });
  });
});