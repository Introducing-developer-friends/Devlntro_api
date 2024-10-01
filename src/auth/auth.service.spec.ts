import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { UserAccount } from '../entities/user-account.entity';
import { BusinessProfile } from '../entities/business-profile.entity';
import { BadRequestException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt');

describe('AuthService', () => {
  let service: AuthService;
  let mockUserRepository: any;
  let mockProfileRepository: any;
  let mockJwtService: any;

  beforeEach(async () => {
    // 모의 객체 설정
    mockUserRepository = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    };
    mockProfileRepository = {
      create: jest.fn(),
      save: jest.fn(),
    };
    mockJwtService = {
      sign: jest.fn(),
    };

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

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // AuthService 특정 테스트
  it('should return false if ID is not available', async () => {
    mockUserRepository.findOne.mockResolvedValue({ login_id: 'test_id' });
    const result = await service.checkIdAvailability('test_id');
    expect(result).toEqual({ available: false, message: '이미 사용 중인 아이디입니다.' });
  });

  it('should register a new user', async () => {
    mockUserRepository.findOne.mockResolvedValue(null);
    mockUserRepository.create.mockReturnValue({ user_id: 1 });
    mockUserRepository.save.mockResolvedValue({ user_id: 1 });
    mockProfileRepository.create.mockReturnValue({});
    mockProfileRepository.save.mockResolvedValue({});
    (bcrypt.hash as jest.Mock).mockResolvedValue('hashed_password');

    const result = await service.register({
      login_id: 'test',
      password: 'password',
      confirm_password: 'password123',
      name: 'Test User',
      company: 'Test Company',
      department: 'Test Dept',
      position: 'Developer',
      email: 'test@test.com',
      phone: '01012345678',
    });

    expect(result).toEqual({
      userId: 1,
      message: '회원가입이 성공적으로 완료되었습니다.'
    });
  });

  it('should return null on invalid login', async () => {
    mockUserRepository.findOne.mockResolvedValue({ user_id: 1, login_id: 'test', password: 'hashed_password' });
    (bcrypt.compare as jest.Mock).mockResolvedValue(false);

    const result = await service.login({ login_id: 'test', password: 'wrong_password' });
    expect(result).toBeNull();
  });
});