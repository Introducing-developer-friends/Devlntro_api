import { Injectable } from '@nestjs/common';
import { FeedFilterService } from '../services/feed-filter.service';
import { SortingService } from '../services/sorting-service'; // SortingService 임포트
import { SortOption } from '../dto/feed-query.dto';

@Injectable()
export class FeedService {
  constructor(
    private feedFilterService: FeedFilterService,
    private sortingService: SortingService // SortingService 주입
  ) {}

  /**
   * 피드 조회: 필터링된 게시물에 정렬 옵션을 적용
   * @param userId - 현재 유저 ID
   * @param sortOption - 정렬 기준 ('latest', 'likes', 'comments')
   * @param filterType - 필터링 기준 ('all', 'own', 'specific')
   * @param specificUserId - 특정 유저의 게시물만 조회할 때 사용하는 유저 ID (선택적)
   * @returns 정렬된 게시물 리스트
   */
  async getFeed(userId: number, sortOption: SortOption, filterType: 'all' | 'own' | 'specific', specificUserId?: number) {
    // 공통 필터링 로직 사용 (필터 타입에 따라 본인 + 인맥 또는 특정 유저 게시물 필터링)
    const posts = await this.feedFilterService.filterPostsByUser(userId, filterType, specificUserId);

    // 공통 정렬 로직 사용 (최신순, 좋아요순, 댓글순으로 정렬)
    const sortedPosts = this.sortingService.sortPosts(posts, sortOption);

    return sortedPosts;
  }
}
