import { Injectable } from '@nestjs/common';
import { SortOption } from '../dto/feed-query.dto';

@Injectable()
export class SortingService {
  /**
   * 게시물 리스트를 정렬하는 메서드
   * 
   * @param posts - 정렬할 게시물 리스트
   * @param sortOption - 정렬 옵션 (LIKES, COMMENTS, LATEST)
   * @returns 정렬된 게시물 리스트
   */
  
  sortPosts(posts: any[], sortOption: SortOption) {
    switch (sortOption) {
      case SortOption.LIKES:
        return posts.sort((a, b) => (b.post_like_count || 0) - (a.post_like_count || 0));
      case SortOption.COMMENTS:
        return posts.sort((a, b) => (b.comments_count || 0) - (a.comments_count || 0));
      default: // LATEST
        return posts.sort((a, b) => {
          const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
          const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
          return dateB - dateA;
        });
    }
  }
}