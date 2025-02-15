import { Test, TestingModule } from '@nestjs/testing';
import { FeedFilterService } from './feed-filter.service';
import { Post } from '../post/entity/post.entity';
import { BusinessContact } from '../contacts/entity/business-contact.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { FilterType } from '../enums/sort.enum';

const mockDate = new Date('2024-01-01');

const mockPost = {
  post_id: 1,
  created_at: mockDate,
  image_url: 'test.jpg',
  post_like_count: 5,
  comments_count: 3,
  deleted_at: null,
  user: {
    user_id: 1,
    name: 'Test User',
  },
};

const mockQueryBuilder = {
  leftJoin: jest.fn().mockReturnThis(),
  innerJoin: jest.fn().mockReturnThis(),
  where: jest.fn().mockReturnThis(),
  andWhere: jest.fn().mockReturnThis(),
  select: jest.fn().mockReturnThis(),
  getMany: jest.fn().mockResolvedValue([mockPost]),
};

const mockPostRepository = {
  createQueryBuilder: jest.fn(() => mockQueryBuilder),
};

describe('FeedFilterService', () => {
  let service: FeedFilterService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FeedFilterService,
        { provide: getRepositoryToken(Post), useValue: mockPostRepository },
        { provide: getRepositoryToken(BusinessContact), useValue: {} },
      ],
    }).compile();

    service = module.get<FeedFilterService>(FeedFilterService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('filterPostsByUser - 기본 필터링 테스트', () => {
    it('should filter posts by ALL filter type', async () => {
      const result = await service.filterPostsByUser(1, FilterType.ALL);

      expect(result).toEqual([mockPost]);
      expect(mockPostRepository.createQueryBuilder).toHaveBeenCalled();
      expect(mockQueryBuilder.leftJoin).toHaveBeenCalledWith(
        'post.user',
        'user',
      );
      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        'post.deleted_at IS NULL',
      );
      expect(mockQueryBuilder.innerJoin).toHaveBeenCalledWith(
        'business_contact',
        'bc',
        '(bc.user_id = :userId AND bc.contact_user_id = user.user_id) OR ' +
          '(bc.contact_user_id = :userId AND bc.user_id = user.user_id) OR ' +
          'user.user_id = :userId',
        { userId: 1 },
      );
    });

    it('should filter posts by OWN filter type', async () => {
      const result = await service.filterPostsByUser(1, FilterType.OWN);

      expect(result).toEqual([mockPost]);
      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        'post.deleted_at IS NULL',
      );
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'user.user_id = :userId',
        { userId: 1 },
      );
    });

    it('should filter posts by SPECIFIC filter type', async () => {
      const result = await service.filterPostsByUser(1, FilterType.SPECIFIC, 2);

      expect(result).toEqual([mockPost]);
      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        'post.deleted_at IS NULL',
      );
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'user.user_id = :specificUserId',
        { specificUserId: 2 },
      );
    });
  });

  describe('filterPostsByUser - 필드 검증', () => {
    it('should select all required fields', async () => {
      await service.filterPostsByUser(1, FilterType.ALL);

      expect(mockQueryBuilder.select).toHaveBeenCalledWith([
        'post.post_id',
        'post.created_at',
        'post.image_url',
        'post.post_like_count',
        'post.comments_count',
        'user.user_id',
        'user.name',
      ]);
    });

    it('should return posts with correct data structure', async () => {
      const result = await service.filterPostsByUser(1, FilterType.ALL);

      expect(result[0]).toHaveProperty('post_id');
      expect(result[0]).toHaveProperty('created_at');
      expect(result[0]).toHaveProperty('image_url');
      expect(result[0]).toHaveProperty('post_like_count');
      expect(result[0]).toHaveProperty('comments_count');
      expect(result[0].user).toHaveProperty('user_id');
      expect(result[0].user).toHaveProperty('name');
    });
  });

  describe('filterPostsByUser - 에러 처리', () => {
    it('should throw BadRequestException when specificUserId is missing for SPECIFIC filter', async () => {
      await expect(
        service.filterPostsByUser(1, FilterType.SPECIFIC),
      ).rejects.toThrow('특정 사용자 ID가 필요합니다.');
    });

    it('should handle database query error', async () => {
      mockQueryBuilder.getMany.mockRejectedValueOnce(
        new Error('Database error'),
      );

      await expect(
        service.filterPostsByUser(1, FilterType.ALL),
      ).rejects.toThrow('Database error');
    });

    it('should handle business contact join error', async () => {
      mockQueryBuilder.innerJoin.mockImplementationOnce(() => {
        throw new Error('Join operation failed');
      });

      await expect(
        service.filterPostsByUser(1, FilterType.ALL),
      ).rejects.toThrow('Join operation failed');
    });

    it('should properly handle user with no business contacts', async () => {
      mockQueryBuilder.getMany.mockResolvedValueOnce([]);

      const result = await service.filterPostsByUser(1, FilterType.ALL);

      expect(result).toEqual([]);
      expect(mockQueryBuilder.innerJoin).toHaveBeenCalled();
    });
  });

  describe('filterPostsByUser - 엣지 케이스', () => {
    it('should handle empty result', async () => {
      mockQueryBuilder.getMany.mockResolvedValueOnce([]);

      const result = await service.filterPostsByUser(1, FilterType.ALL);
      expect(result).toEqual([]);
    });

    it('should filter out deleted posts', async () => {
      await service.filterPostsByUser(1, FilterType.ALL);

      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        'post.deleted_at IS NULL',
      );
    });

    it('should handle large number of posts', async () => {
      const manyPosts = Array(100).fill(mockPost);
      mockQueryBuilder.getMany.mockResolvedValueOnce(manyPosts);

      const result = await service.filterPostsByUser(1, FilterType.ALL);
      expect(result).toHaveLength(100);
    });
  });
});
