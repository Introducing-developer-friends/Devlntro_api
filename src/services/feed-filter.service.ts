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
      .select(['post.post_id', 'post.created_at', 'post.image_url', 'user.user_id', 'user.name'])
      .addSelect('post.post_like_count') 
      .addSelect('post.comments_count'); 

      // 'all' 필터 타입: 사용자의 모든 게시물과 비즈니스 연락처의 게시물을 조회
      if (filterType === 'all') {
        query = query
          .where(new Brackets(qb => {
            qb.where('user.user_id = :userId', { userId })
              .orWhere(`user.user_id IN (
                SELECT CASE
                  WHEN bc.user_id = :userId THEN bc.contact_user_id
                  WHEN bc.contact_user_id = :userId THEN bc.user_id
                END
                FROM business_contact bc
                WHERE bc.user_id = :userId OR bc.contact_user_id = :userId
              )`, { userId });
          }));
      // 'own' 필터 타입: 사용자의 자신의 게시물만 조회
    } else if (filterType === 'own') {
        query = query.where('user.user_id = :userId', { userId });

      // 'specific' 필터 타입: 특정 사용자의 게시물만 조회
      } else if (filterType === 'specific' && specificUserId) {
        query = query.where('user.user_id = :specificUserId', { specificUserId });
    }

    // 최종적으로 필터링된 게시물들을 조회하여 반환
    return await query.getMany();
  }
}