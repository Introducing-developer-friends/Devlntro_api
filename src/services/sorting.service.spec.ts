import { Test, TestingModule } from '@nestjs/testing';
import { SortingService } from './sorting-service';
import { SortOption } from '../dto/feed-query.dto';

// SortingService 테스트 스위트
describe('SortingService', () => {
  let service: SortingService;

  // 각 테스트 실행 전에 SortingService 모듈을 생성
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SortingService],
    }).compile();

    // SortingService 인스턴스 가져오기
    service = module.get<SortingService>(SortingService);
  });

  // SortingService가 제대로 정의되었는지 확인하는 테스트
  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // sortPosts 메서드에 대한 테스트 스위트
  describe('sortPosts', () => {
    const posts = [
      { post_like_count: 10, comments_count: 5, created_at: '2024-09-18T12:00:00.000Z' },
      { post_like_count: 3, comments_count: 10, created_at: '2024-09-17T12:00:00.000Z' },
      { post_like_count: 20, comments_count: 2, created_at: '2024-09-19T12:00:00.000Z' },
    ];

    // 좋아요 수에 따른 내림차순 정렬 테스트
    it('should sort posts by likes in descending order', () => {
      const sorted = service.sortPosts(posts, SortOption.LIKES);
      expect(sorted[0].post_like_count).toBe(20); // 첫 번째 요소는 좋아요 수가 20이어야 함
      expect(sorted[1].post_like_count).toBe(10);
      expect(sorted[2].post_like_count).toBe(3);
    });

    // 댓글 수에 따른 내림차순 정렬 테스트
    it('should sort posts by comments in descending order', () => {
      const sorted = service.sortPosts(posts, SortOption.COMMENTS);
      expect(sorted[0].comments_count).toBe(10); // 첫 번째 요소는 댓글 수가 10이어야 함
      expect(sorted[1].comments_count).toBe(5);
      expect(sorted[2].comments_count).toBe(2);
    });

    // 최신순 정렬 테스트
    it('should sort posts by latest in descending order', () => {
      const sorted = service.sortPosts(posts, SortOption.LATEST);
      expect(new Date(sorted[0].created_at).getTime()).toBeGreaterThan(new Date(sorted[1].created_at).getTime());
      expect(new Date(sorted[1].created_at).getTime()).toBeGreaterThan(new Date(sorted[2].created_at).getTime());
    });
  });
});
