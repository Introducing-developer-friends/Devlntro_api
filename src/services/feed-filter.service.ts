import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Post } from '../entities/post.entity';
import { FilterType } from '../types/feed.types';

@Injectable()
export class FeedFilterService {
  private readonly logger = new Logger(FeedFilterService.name);

  constructor(
    @InjectRepository(Post)
    private readonly postRepository: Repository<Post>,
  ) {}

  async filterPostsByUser(
    userId: number,
    filterType: FilterType,
    specificUserId?: number,
  ): Promise<Post[]> {
    try {
      const query = this.postRepository
        .createQueryBuilder('post')
        .leftJoin('post.user', 'user')
        .where('post.deleted_at IS NULL');

      switch (filterType) {
        case FilterType.ALL:
          query.innerJoin(
            'business_contact',
            'bc',
            '(bc.user_id = :userId AND bc.contact_user_id = user.user_id) OR ' +
              '(bc.contact_user_id = :userId AND bc.user_id = user.user_id) OR ' +
              'user.user_id = :userId',
            { userId },
          );
          break;

        case FilterType.OWN:
          query.andWhere('user.user_id = :userId', { userId });
          break;

        case FilterType.SPECIFIC:
          if (!specificUserId) {
            throw new BadRequestException('특정 사용자 ID가 필요합니다.');
          }
          query.andWhere('user.user_id = :specificUserId', { specificUserId });
          break;
      }

      return await query
        .select([
          'post.post_id',
          'post.created_at',
          'post.image_url',
          'post.post_like_count',
          'post.comments_count',
          'user.user_id',
          'user.name',
        ])
        .getMany();
    } catch (error) {
      this.logger.error(`Error filtering posts: ${error.message}`);
      throw error;
    }
  }
}
