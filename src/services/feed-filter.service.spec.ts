import { Test, TestingModule } from '@nestjs/testing';
import { FeedFilterService } from './feed-filter.service';
import { Post } from '../entities/post.entity';
import { BusinessContact } from '../entities/business-contact.entity';
import { getRepositoryToken } from '@nestjs/typeorm';

// QueryBuilder 모의 객체 정의
const mockQueryBuilder = {
  leftJoinAndSelect: jest.fn().mockReturnThis(),
  select: jest.fn().mockReturnThis(),
  addSelect: jest.fn().mockReturnThis(),
  where: jest.fn().mockReturnThis(),
  orderBy: jest.fn().mockReturnThis(),
  getMany: jest.fn().mockResolvedValue([]),
};

// Post 리포지토리 모의 객체 정의
const mockPostRepository = {
  createQueryBuilder: jest.fn(() => mockQueryBuilder),
};

describe('FeedFilterService', () => {
  let service: FeedFilterService;

  // 각 테스트 실행 전에 모듈 생성 및 서비스 인스턴스 주입
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FeedFilterService,
        { provide: getRepositoryToken(Post), useValue: mockPostRepository },
        { provide: getRepositoryToken(BusinessContact), useValue: {} }, // Mock for BusinessContact repository
      ],
    }).compile();

    service = module.get<FeedFilterService>(FeedFilterService);
  });

  // FeedFilterService가 정의되었는지 확인하는 테스트
  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // "all" 필터 타입으로 게시물을 필터링하는 테스트
  it('should filter posts by "all" filter type', async () => {
    const result = await service.filterPostsByUser(1, 'all');

    // 반환된 결과가 빈 배열인지 확인
    expect(result).toEqual([]);
    expect(mockPostRepository.createQueryBuilder).toHaveBeenCalled();
    expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalledWith('post.user', 'user');
    expect(mockQueryBuilder.where).toHaveBeenCalled();
    expect(mockQueryBuilder.getMany).toHaveBeenCalled();
  });

  // "own" 필터 타입으로 게시물을 필터링하는 테스트
  it('should filter posts by "own" filter type', async () => {
    const result = await service.filterPostsByUser(1, 'own');

    // 반환된 결과가 빈 배열인지 확인
    expect(result).toEqual([]);

    // where 조건이 사용자의 게시물만 필터링하는지 확인
    expect(mockPostRepository.createQueryBuilder().where).toHaveBeenCalledWith('user.user_id = :userId', { userId: 1 });
  });

  // "specific" 필터 타입으로 게시물을 필터링하는 테스트
  it('should filter posts by "specific" filter type', async () => {
    const result = await service.filterPostsByUser(1, 'specific', 2);

    // 반환된 결과가 빈 배열인지 확인
    expect(result).toEqual([]);

    // where 조건이 특정 사용자의 게시물만 필터링하는지 확인
    expect(mockPostRepository.createQueryBuilder().where).toHaveBeenCalledWith('user.user_id = :specificUserId', { specificUserId: 2 });
  });
});
