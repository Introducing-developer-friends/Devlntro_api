import { Injectable } from '@nestjs/common';
import { SortOption } from '../dto/feed-query.dto';

@Injectable()
export class SortingService {
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