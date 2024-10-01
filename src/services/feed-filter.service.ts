import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Brackets } from 'typeorm';
import { Post } from '../entities/post.entity';
import { BusinessContact } from '../entities/business-contact.entity';

@Injectable()
export class FeedFilterService {

  // FeedFilterService 클래스에서 사용할 로거 인스턴스 생성
  private readonly logger = new Logger(FeedFilterService.name);

  constructor(
    @InjectRepository(Post)
    private postRepository: Repository<Post>, // Post 엔티티에 대한 리포지토리 주입
    
    @InjectRepository(BusinessContact)
    private businessContactRepository: Repository<BusinessContact>, // BusinessContact 엔티티에 대한 리포지토리 주입
  ) {}

  async filterPostsByUser(
    userId: number,
    filterType: 'all' | 'own' | 'specific',
    specificUserId?: number
  ) {

    // 게시물을 조회하는 쿼리 빌더 생성
    let query = this.postRepository.createQueryBuilder('post')
      .leftJoinAndSelect('post.user', 'user') // post와 연관된 user를 조인
      .select(['post.post_id', 'post.created_at', 'post.image_url', 'user.user_id', 'user.name']);

      // 'all' 필터 타입: 사용자의 모든 게시물과 비즈니스 연락처의 게시물을 조회
    if (filterType === 'all') {
      const contactUserIds = await this.businessContactRepository
        .createQueryBuilder('contact')
        .select('contact.contact_user_id')
        .where('contact.user_id = :userId', { userId })
        .getRawMany();

      const contactUserIdArray = contactUserIds.map(contact => contact.contact_user_id);
      
      query = query.where(new Brackets(qb => {
        qb.where('user.user_id = :userId', { userId }); // 자신의 게시물 포함
        if (contactUserIdArray.length > 0) {
          qb.orWhere('user.user_id IN (:...contactUserIdArray)', { contactUserIdArray }); // 연락처 사용자의 게시물 포함
        }
      }));
      // 'own' 필터 타입: 사용자의 자신의 게시물만 조회
    } else if (filterType === 'own') {
        query = query.where('user.user_id = :userId', { userId });

      // 'specific' 필터 타입: 특정 사용자의 게시물만 조회
      } else if (filterType === 'specific' && specificUserId) {
        query = query.where('user.user_id = :specificUserId', { specificUserId });
    }

    // 쿼리 로깅 추가 (디버깅 용도)
    const rawQuery = query.getQueryAndParameters();
    this.logger.debug(`Generated SQL: ${rawQuery[0]}`); // 생성된 SQL 쿼리 출력
    this.logger.debug(`Query parameters: ${JSON.stringify(rawQuery[1])}`); // 쿼리 파라미터 출력

    // 최종적으로 필터링된 게시물들을 조회하여 반환
    return await query.getMany();
  }
}