import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { UserAccount } from '../entities/user-account.entity';
import { BusinessProfile } from '../entities/business-profile.entity';
import { BadRequestException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt'); // bcrypt 모듈을 모킹

describe('AuthService', () => {
  let service: AuthService;
  let mockUserRepository: any;
  let mockProfileRepository: any;
  let mockJwtService: any;
  let mockQueryBuilder: any;
  let mockQueryRunner: any;

  // 각 테스트 전에 모킹된 객체 및 서비스 설정
  beforeEach(async () => {

    // 쿼리 빌더 설정 (where, getCount, getOne 메서드 모킹)
    mockQueryBuilder = {
      where: jest.fn().mockReturnThis(),
      getCount: jest.fn(),
      getOne: jest.fn(),
      select: jest.fn().mockReturnThis(),
    };

    // 쿼리 러너 설정 (트랜잭션 관련 메서드 모킹)
    mockQueryRunner = {
      connect: jest.fn(),
      startTransaction: jest.fn(),
      commitTransaction: jest.fn(),
      rollbackTransaction: jest.fn(),
      release: jest.fn(),
      manager: {
        createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
        save: jest.fn(),
        create: jest.fn(),
      },
    };

    // UserAccount 리포지토리 설정
    mockUserRepository = {
      createQueryBuilder: jest.fn(() => mockQueryBuilder),
      manager: {
        connection: {
          createQueryRunner: jest.fn().mockReturnValue(mockQueryRunner),
        },
      },
    };

    // BusinessProfile 리포지토리 설정
    mockProfileRepository = {
      create: jest.fn(),
      save: jest.fn(),
    };

    // JwtService 설정
    mockJwtService = {
      sign: jest.fn(),
    };

    // 테스트 모듈 설정
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: getRepositoryToken(UserAccount), useValue: mockUserRepository },
        { provide: getRepositoryToken(BusinessProfile), useValue: mockProfileRepository },
        { provide: JwtService, useValue: mockJwtService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  // AuthService가 정의되었는지 확인
  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ID 중복 체크 테스트
  it('should return false if ID is not available', async () => {
    mockQueryBuilder.getCount.mockResolvedValue(1); // 이미 아이디가 존재한다고 설정
    const result = await service.checkIdAvailability('test_id');
    expect(result).toEqual({ available: false, message: '이미 사용 중인 아이디입니다.' });
  });

  // 회원가입 테스트
  it('should register a new user', async () => {
    mockQueryBuilder.getOne.mockResolvedValue(null);
    mockQueryRunner.manager.create.mockImplementation((entity, data) => {
      if (entity === UserAccount) {
        return { user_id: 1, ...data };
      }
      return data;
    });
    mockQueryRunner.manager.save.mockResolvedValueOnce({ user_id: 1 });
    mockQueryRunner.manager.save.mockResolvedValueOnce({});
    (bcrypt.hash as jest.Mock).mockResolvedValue('hashed_password');

    // 회원가입 호출
    const result = await service.register({
      login_id: 'test',
      password: 'password',
      confirm_password: 'password',
      name: 'Test User',
      company: 'Test Company',
      department: 'Test Dept',
      position: 'Developer',
      email: 'test@test.com',
      phone: '01012345678',
    });

    // 트랜잭션 관련 메서드들이 호출되었는지 확인
    expect(mockQueryRunner.connect).toHaveBeenCalled();
    expect(mockQueryRunner.startTransaction).toHaveBeenCalled();
    expect(mockQueryRunner.commitTransaction).toHaveBeenCalled();
    expect(mockQueryRunner.release).toHaveBeenCalled();

    // 회원가입 결과 확인
    expect(result).toEqual({
      userId: 1,
      message: '회원가입이 성공적으로 완료되었습니다.',
    });
  });

  // 회원가입 중 에러 발생 시 예외 처리 테스트
  it('should throw BadRequestException if registration fails', async () => {
    mockQueryBuilder.getOne.mockRejectedValue(new Error('Database error'));

    // 회원가입 호출 시 BadRequestException이 발생하는지 확인
    await expect(service.register({
      login_id: 'test',
      password: 'password',
      confirm_password: 'password',
      name: 'Test User',
      company: 'Test Company',
      department: 'Test Dept',
      position: 'Developer',
      email: 'test@test.com',
      phone: '01012345678',
    })).rejects.toThrow(BadRequestException);

    // 트랜잭션 롤백과 release가 호출되었는지 확인
    expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalled();
    expect(mockQueryRunner.release).toHaveBeenCalled();
  });
});
