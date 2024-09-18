import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Brackets } from 'typeorm';
import { Post } from '../entities/post.entity';
import { BusinessContact } from '../entities/business-contact.entity';

@Injectable()
export class FeedFilterService {
  private readonly logger = new Logger(FeedFilterService.name);

  constructor(
    @InjectRepository(Post)
    private postRepository: Repository<Post>,
    
    @InjectRepository(BusinessContact)
    private businessContactRepository: Repository<BusinessContact>,
  ) {}

  async filterPostsByUser(
    userId: number,
    filterType: 'all' | 'own' | 'specific',
    specificUserId?: number
  ) {
    let query = this.postRepository.createQueryBuilder('post')
      .leftJoinAndSelect('post.user', 'user')
      .select(['post.post_id', 'post.created_at', 'post.image_url', 'user.user_id', 'user.name']);

    if (filterType === 'all') {
      const contactUserIds = await this.businessContactRepository
        .createQueryBuilder('contact')
        .select('contact.contact_user_id')
        .where('contact.user_id = :userId', { userId })
        .getRawMany();

      const contactUserIdArray = contactUserIds.map(contact => contact.contact_user_id);
      
      query = query.where(new Brackets(qb => {
        qb.where('user.user_id = :userId', { userId }); 
        if (contactUserIdArray.length > 0) {
          qb.orWhere('user.user_id .user_id IN (:...contactUserIdArray)', { contactUserIdArray });
        }
      }));
    } else if (filterType === 'own') {
        query = query.where('user.user_id = :userId', { userId });
    } else if (filterType === 'specific' && specificUserId) {
        query = query.where('user.user_id = :specificUserId', { specificUserId });
    }

    // 쿼리 로깅 추가
    const rawQuery = query.getQueryAndParameters();
    this.logger.debug(`Generated SQL: ${rawQuery[0]}`);
    this.logger.debug(`Query parameters: ${JSON.stringify(rawQuery[1])}`);

    return await query.getMany();
  }
}