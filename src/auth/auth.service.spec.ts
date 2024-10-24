import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { UserAccount } from '../entities/user-account.entity';
import { BusinessProfile } from '../entities/business-profile.entity';
import { BadRequestException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt');

// 테스트 시작 전에 실행되는 초기화 블록
describe('AuthService', () => {
  let service: AuthService;
  let mockUserRepository: any;
  let mockProfileRepository: any;
  let mockJwtService: any;
  let mockQueryBuilder: any;
  let mockQueryRunner: any;

  beforeEach(async () => {
    mockQueryBuilder = {
      where: jest.fn().mockReturnThis(),
      getCount: jest.fn(),
      getOne: jest.fn(),
      select: jest.fn().mockReturnThis(),
    };

    // QueryRunner Mock 설정
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

    // 유저 레포지토리 Mock 설정
    mockUserRepository = {
      createQueryBuilder: jest.fn(() => mockQueryBuilder),
      manager: {
        connection: {
          createQueryRunner: jest.fn().mockReturnValue(mockQueryRunner),
        },
      },
    };

    // 프로필 레포지토리 Mock 설정
    mockProfileRepository = {
      create: jest.fn(),
      save: jest.fn(),
    };

    // JwtService Mock 설정
    mockJwtService = {
      sign: jest.fn().mockReturnValue('test_token'),
    };

    // NestJS 테스트 모듈 생성 및 컴파일
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

  // AuthService가 정의되었는지 테스트
  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // checkIdAvailability 메서드 테스트
  describe('checkIdAvailability', () => {
    it('should return true if ID is available', async () => {
      mockQueryBuilder.getCount.mockResolvedValue(0);
      const result = await service.checkIdAvailability('test_id');
      expect(result).toEqual({ available: true });
    });

    // ID가 이미 사용 중일 때
    it('should return false if ID is not available', async () => {
      mockQueryBuilder.getCount.mockResolvedValue(1);
      const result = await service.checkIdAvailability('test_id');
      expect(result).toEqual({ available: false });
    });
  });

  // register 메서드 테스트
  describe('register', () => {
    const registerDto = {
      login_id: 'test',
      password: 'password',
      confirm_password: 'password',
      name: 'Test User',
      company: 'Test Company',
      department: 'Test Dept',
      position: 'Developer',
      email: 'test@test.com',
      phone: '01012345678',
    };

    // 유저 등록 성공 시
    it('should register a new user', async () => {
      mockQueryBuilder.getOne.mockResolvedValue(null);
      mockQueryRunner.manager.create
        .mockImplementationOnce((entity, data) => ({
          user_id: 1,
          ...data,
        }))
        .mockImplementationOnce((entity, data) => ({
          ...data,
        }));
      
      mockQueryRunner.manager.save
        .mockResolvedValueOnce({ user_id: 1 })
        .mockResolvedValueOnce({});
      
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed_password');

      const result = await service.register(registerDto);

      // 트랜잭션 동작 확인
      expect(mockQueryRunner.connect).toHaveBeenCalled();
      expect(mockQueryRunner.startTransaction).toHaveBeenCalled();
      expect(mockQueryRunner.commitTransaction).toHaveBeenCalled();
      expect(mockQueryRunner.release).toHaveBeenCalled();

      expect(result).toEqual({
        userId: 1
      });
    });

    // 비밀번호가 일치하지 않을 때
    it('should throw BadRequestException if passwords do not match', async () => {
      const invalidDto = {
        ...registerDto,
        confirm_password: 'different_password',
      };

      await expect(service.register(invalidDto))
        .rejects
        .toThrow(BadRequestException);

      expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalled();
      expect(mockQueryRunner.release).toHaveBeenCalled();
    });

    // 유저가 이미 존재할 때
    it('should throw BadRequestException if user already exists', async () => {
      mockQueryBuilder.getOne.mockResolvedValue({ user_id: 1 });

      await expect(service.register(registerDto))
        .rejects
        .toThrow(BadRequestException);

      expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalled();
      expect(mockQueryRunner.release).toHaveBeenCalled();
    });
  });

  // login 메서드 테스트
  describe('login', () => {
    const loginDto = {
      login_id: 'test',
      password: 'password'
    };

    // 로그인 성공 시
    it('should return token and userId on successful login', async () => {
      const mockUser = {
        user_id: 1,
        login_id: 'test',
        password: 'hashed_password'
      };

      mockQueryBuilder.getOne.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.login(loginDto);

      expect(result).toEqual({
        token: 'test_token',
        userId: 1
      });
    });

    // 로그인 실패 (유저 정보 없음)
    it('should return null for invalid credentials', async () => {
      mockQueryBuilder.getOne.mockResolvedValue(null);

      const result = await service.login(loginDto);

      expect(result).toBeNull(); // 잘못된 자격 증명으로 null 반환
    });
  });
});