import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Post } from '../entities/post.entity';
import { BusinessContact } from '../entities/business-contact.entity';

@Injectable()
export class FeedFilterService {
  constructor(
    @InjectRepository(Post) // Post 엔티티에 대한 Repository 주입 (게시물 관련 데이터베이스 작업을 위해 사용)
    private postRepository: Repository<Post>,
    
    @InjectRepository(BusinessContact) // BusinessContact 엔티티에 대한 Repository 주입 (인맥 관련 데이터베이스 작업을 위해 사용)
    private businessContactRepository: Repository<BusinessContact>,
  ) {}

  /**
   * 공통 필터링 로직: 본인 게시물, 인맥 게시물, 또는 특정 유저 게시물 필터링
   * @param userId - 요청한 유저의 ID
   * @param filterType - 필터링 유형 ('all', 'own', 'specific')
   * @param specificUserId - 특정 유저의 게시물만 필터링할 때 사용하는 유저 ID (선택적 파라미터)
   * @returns 필터링된 게시물 목록
   */
  async filterPostsByUser(
    userId: number,
    filterType: 'all' | 'own' | 'specific',
    specificUserId?: number
  ) {
    // 기본 게시물 조회 쿼리 생성
    let query = this.postRepository.createQueryBuilder('post')
      .leftJoinAndSelect('post.user', 'user') // 게시물과 작성한 유저를 조인
      .select(['post.postId', 'post.createdAt', 'post.imageUrl', 'user.userId', 'user.name']); // 필요한 필드만 선택

    // 1. 본인 게시물 + 인맥 게시물 모두 필터링 (메인 페이지 용도)
    if (filterType === 'all') {
      // 현재 유저와 연결된 인맥 ID 리스트 조회
      const contactUserIds = await this.businessContactRepository
        .createQueryBuilder('contact')
        .select('contact.contact_user_id')
        .where('contact.user_id = :userId', { userId }) // 현재 유저와 연결된 인맥들 조회
        .getRawMany();

      const contactUserIdArray = contactUserIds.map(contact => contact.contact_user_id); // 인맥들의 user_id 배열

      // 본인 게시물 또는 인맥 게시물을 모두 포함하는 쿼리
      query = query.where('post.userId = :userId', { userId })
                   .orWhere('post.userId IN (:...contactUserIdArray)', { contactUserIdArray });

    // 2. 본인 게시물만 필터링 (마이 페이지 용도)
    } else if (filterType === 'own') {
      query = query.where('post.userId = :userId', { userId });

    // 3. 특정 유저의 게시물만 필터링 (특정 유저 페이지 용도)
    } else if (filterType === 'specific' && specificUserId) {
      query = query.where('post.userId = :specificUserId', { specificUserId });
    }

    // 최종 필터링된 게시물 목록 반환
    const posts = await query.getMany();
    return posts;
  }
}
