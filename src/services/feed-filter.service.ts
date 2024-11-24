import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Brackets } from 'typeorm';
import { Post } from '../entities/post.entity';
import { BusinessContact } from '../entities/business-contact.entity';
import { FilterType } from 'src/types/feed.types';

@Injectable()
export class FeedFilterService {
  // FeedFilterService 클래스에서 사용할 로거 인스턴스 생성
  private readonly logger = new Logger(FeedFilterService.name);

  constructor(
    @InjectRepository(Post)
    private readonly postRepository: Repository<Post>,
    @InjectRepository(BusinessContact)
    private readonly businessContactRepository: Repository<BusinessContact>,
  ) {}

  // 사용자 기준으로 게시물을 필터링하는 메서드
  async filterPostsByUser(
    userId: number,
    filterType: FilterType,
    specificUserId?: number
  ): Promise<Post[]> {
    try {

      // 기본 쿼리 빌더 설정
      const query = this.postRepository.createQueryBuilder('post')
        .leftJoin('post.user', 'user')
        .where('post.deleted_at IS NULL');

      // 필터 타입에 따른 조건 추가
      switch (filterType) {
        case FilterType.ALL:
          // 비즈니스 연락처 조회를 Join으로 변경
          query.innerJoin(
            'business_contact',
            'bc',
            '(bc.user_id = :userId AND bc.contact_user_id = user.user_id) OR ' +
            '(bc.contact_user_id = :userId AND bc.user_id = user.user_id) OR ' +
            'user.user_id = :userId',
            { userId }
          );
          break;

        case FilterType.OWN:
          // 사용자 자신의 게시물만 조회
          query.andWhere('user.user_id = :userId', { userId });
          break;

        case FilterType.SPECIFIC:
          // 특정 사용자의 게시물만 조회
          if (!specificUserId) {
            throw new BadRequestException('특정 사용자 ID가 필요합니다.');
          }
          query.andWhere('user.user_id = :specificUserId', { specificUserId });
          break;
      }

      // 필요한 필드만 선택하여 조회
      return await query
        .select([
          'post.post_id',
          'post.created_at',
          'post.image_url',
          'post.post_like_count',
          'post.comments_count',
          'user.user_id',
          'user.name'
        ])
        .getMany();

    } catch (error) {
      this.logger.error(`Error filtering posts: ${error.message}`);
      throw error;
    }
  }
}