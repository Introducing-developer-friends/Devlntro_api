import { Injectable } from '@nestjs/common';
import { SortOption } from '../dto/feed-query.dto';

@Injectable()
export class SortingService {
  // 게시물 정렬 로직을 공통으로 처리하는 함수
  sortPosts(posts: any[], sortOption: SortOption) {
    switch (sortOption) {
      case SortOption.LIKES:
        return posts.sort((a, b) => b.likesCount - a.likesCount);
      case SortOption.COMMENTS:
        return posts.sort((a, b) => b.commentsCount - a.commentsCount);
      default:
        return posts.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    }
  }
}
