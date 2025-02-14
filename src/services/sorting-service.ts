import { Injectable } from '@nestjs/common';
import { PostBasicInfo } from '../types/feed.types';
import { Post } from 'src/entities/post.entity';
import { SortOption } from '../enums/sort.enum';

@Injectable()
export class SortingService {
  sortPosts(posts: Post[], sortOption: SortOption): PostBasicInfo[] {
    const sortedPosts = [...posts].sort((a, b) => {
      switch (sortOption) {
        case SortOption.LIKES:
          return (b.post_like_count || 0) - (a.post_like_count || 0);

        case SortOption.COMMENTS:
          return (b.comments_count || 0) - (a.comments_count || 0);

        case SortOption.LATEST:
        default:
          return this.compareDates(b.created_at, a.created_at);
      }
    });

    return sortedPosts.map((post) => ({
      postId: post.post_id,
      createrId: post.user?.user_id,
      createrName: post.user?.name,
      createdAt: post.created_at,
      imageUrl: post.image_url,
      isOwnPost: false, //
      likesCount: post.post_like_count || 0,
      commentsCount: post.comments_count || 0,
    }));
  }

  private compareDates(dateA: Date | null, dateB: Date | null): number {
    const timeA = dateA ? new Date(dateA).getTime() : 0;
    const timeB = dateB ? new Date(dateB).getTime() : 0;
    return timeA - timeB;
  }
}
