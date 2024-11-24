import { Injectable } from '@nestjs/common';
import { PostBasicInfo, SortOption } from '../types/feed.types';
import { Post } from 'src/entities/post.entity';

@Injectable()
export class SortingService {
  sortPosts(posts: Post[], sortOption: SortOption): PostBasicInfo[] {

    // 게시물 정렬 메서드
    const sortedPosts = [...posts].sort((a, b) => {
      switch (sortOption) {
        case SortOption.LIKES:

          // 좋아요 수 기준 내림차순 정렬
          return (b.post_like_count || 0) - (a.post_like_count || 0);

        case SortOption.COMMENTS:

          // 댓글 수 기준 내림차순 정렬
          return (b.comments_count || 0) - (a.comments_count || 0);

        case SortOption.LATEST:
        default:

          // 생성일 기준 내림차순 정렬
          return this.compareDates(b.created_at, a.created_at);
      }
    });

    return sortedPosts.map(post => ({
      postId: post.post_id,
      createrId: post.user?.user_id,
      createrName: post.user?.name,
      createdAt: post.created_at,
      imageUrl: post.image_url,
      isOwnPost: false, // 이 값은 상위 컴포넌트에서 설정
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