import { Injectable, BadRequestException  } from '@nestjs/common'; // 의존성 주입을 위해 Injectable 사용
import { JwtService } from '@nestjs/jwt'; // JWT 토큰 생성을 위한 JwtService
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, QueryRunner  } from 'typeorm';
import { UserAccount } from '../entities/user-account.entity';
import { BusinessProfile } from '../entities/business-profile.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { LoginDto } from './dto/login.dto'; // 로그인 요청을 위한 DTO
import * as bcrypt from 'bcrypt';
import { AuthResult, IdCheckResult } from '../types/auth.type';

@Injectable() // NestJS의 의존성 주입 데코레이터
export class AuthService {
  constructor(
    @InjectRepository(UserAccount) // UserAccount 리포지토리 의존성 주입
    private readonly  userRepository: Repository<UserAccount>,
    @InjectRepository(BusinessProfile)
    private readonly  profileRepository: Repository<BusinessProfile>,
    private readonly  jwtService: JwtService // JWT 토큰 생성을 위한 JwtService 주입
  ) {}

  // 아이디 중복 확인
  async checkIdAvailability(login_id: string): Promise<IdCheckResult> {
    const user = await this.userRepository
      .createQueryBuilder("user")
      .where("user.login_id = :login_id", { login_id })
      .getCount();

    return { available: !user };
  }

  private async validateRegistrationData(
    createUserDto: CreateUserDto,
    queryRunner: QueryRunner
  ): Promise<void> {
    const { login_id, password, confirm_password } = createUserDto;

    if (password !== confirm_password) {
      throw new BadRequestException('비밀번호와 확인 비밀번호가 일치하지 않습니다.');
    }

    const existingUser = await queryRunner.manager
      .createQueryBuilder(UserAccount, "user")
      .where("user.login_id = :login_id", { login_id })
      .getOne();

    if (existingUser) {
      throw new BadRequestException('이미 존재하는 아이디입니다.');
    }
  }

  // 회원가입 로직
  async register(createUserDto: CreateUserDto): Promise<AuthResult> {
    const queryRunner = this.userRepository.manager.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      await this.validateRegistrationData(createUserDto, queryRunner);
      
      const { login_id, password, name, ...profileData } = createUserDto;
      const hashedPassword = await bcrypt.hash(password, 10);

      const user = queryRunner.manager.create(UserAccount, {
        login_id,
        password: hashedPassword,
        confirm_password: hashedPassword,
        name,
      });
      await queryRunner.manager.save(user);

      const profile = queryRunner.manager.create(BusinessProfile, {
        ...profileData,
        userAccount: user,
      });
      await queryRunner.manager.save(profile);

      await queryRunner.commitTransaction();

      return { userId: user.user_id };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  // 로그인 로직
  async login(loginDto: LoginDto): Promise<AuthResult | null> {
    // 사용자 조회
    const user = await this.userRepository
    .createQueryBuilder("user")
    .select(["user.user_id", "user.login_id", "user.password"])
    .where("user.login_id = :login_id", { login_id: loginDto.login_id })
    .getOne();
  
    if (!user || !await bcrypt.compare(loginDto.password, user.password)) {
      return null;
    }
  
    const payload = { username: user.login_id, sub: user.user_id };
    const token = this.jwtService.sign(payload);

    return {
      token,
      userId: user.user_id
    };
    } 
  
}