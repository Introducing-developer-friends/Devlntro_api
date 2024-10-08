import { Injectable, BadRequestException  } from '@nestjs/common'; // 의존성 주입을 위해 Injectable 사용
import { JwtService } from '@nestjs/jwt'; // JWT 토큰 생성을 위한 JwtService
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserAccount } from '../entities/user-account.entity';
import { BusinessProfile } from '../entities/business-profile.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { LoginDto } from './dto/login.dto'; // 로그인 요청을 위한 DTO
import * as bcrypt from 'bcrypt';

@Injectable() // NestJS의 의존성 주입 데코레이터
export class AuthService {
  constructor(
    @InjectRepository(UserAccount) // UserAccount 리포지토리 의존성 주입
    private userRepository: Repository<UserAccount>,
    @InjectRepository(BusinessProfile)
    private profileRepository: Repository<BusinessProfile>,
    private jwtService: JwtService // JWT 토큰 생성을 위한 JwtService 주입
  ) {}

  // 아이디 중복 확인
  async checkIdAvailability(login_id: string): Promise<{ available: boolean, message: string }> {
    const user = await this.userRepository
    .createQueryBuilder("user")
    .where("user.login_id = :login_id", { login_id })
    .getCount();
    if (!user) {
      return { available: true, message: '사용 가능한 아이디입니다.' };
    } else {
      return { available: false, message: '이미 사용 중인 아이디입니다.' };
    }
  }

  // 회원가입 로직
  async register(createUserDto: CreateUserDto): Promise<{ userId: number; message: string }> {
    const queryRunner = this.userRepository.manager.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
  
    try {
      const { login_id, password, confirm_password, name, ...profileData } = createUserDto;
  
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
  
      const hashedPassword = await bcrypt.hash(password, 10);
  
      const user = queryRunner.manager.create(UserAccount, {
        login_id,
        password: hashedPassword, // 해싱된 비밀번호 저장
        confirm_password: hashedPassword,
        name,
      });
  
      await queryRunner.manager.save(user);
  
      const profile = queryRunner.manager.create(BusinessProfile, {
        ...profileData, // 남은 프로필 정보 저장
        userAccount: user,
      });
  
      await queryRunner.manager.save(profile); // BusinessProfile 저장
  
      await queryRunner.commitTransaction();
  
      return { userId: user.user_id, message: '회원가입이 성공적으로 완료되었습니다.' };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw new BadRequestException('회원가입에 실패했습니다.');
    } finally {
      await queryRunner.release();
    }
  }

  // 로그인 로직
async login(loginDto: LoginDto): Promise<{ token: string; userId: number } | null> {
    // 사용자 조회
    const user = await this.userRepository
    .createQueryBuilder("user")
    .select(["user.user_id", "user.login_id", "user.password"])
    .where("user.login_id = :login_id", { login_id: loginDto.login_id })
    .getOne();
  
    // 사용자 존재 여부 확인
    if (!user) {
      return null;
    }
  
    // 비밀번호 비교
    const passwordMatches = await bcrypt.compare(loginDto.password, user.password);
  
    if (passwordMatches) {
      const payload = { username: user.login_id, sub: user.user_id }; // JWT 페이로드 생성
  
      const token = this.jwtService.sign(payload);
  
      return {
        token, // JWT 토큰 반환
        userId: user.user_id,
      };
    } else {
      return null; // 비밀번호 불일치
    }
  }
  
  
}