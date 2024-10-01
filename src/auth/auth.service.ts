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
    const user = await this.userRepository.findOne({ where: { login_id } });
    if (!user) {
      return { available: true, message: '사용 가능한 아이디입니다.' };
    } else {
      return { available: false, message: '이미 사용 중인 아이디입니다.' };
    }
  }

  // 회원가입 로직
  async register(createUserDto: CreateUserDto): Promise<{ userId: number; message: string }> {
    const { login_id, password, confirm_password, name, ...profileData } = createUserDto; // DTO로 받은 데이터에서 필요한 부분만 추출
    
    // 비밀번호와 확인 비밀번호 일치 여부 확인
  if (password !== confirm_password) {
    throw new BadRequestException('비밀번호와 확인 비밀번호가 일치하지 않습니다.');
  }

    // 이미 존재하는 아이디 체크
    const existingUser = await this.userRepository.findOne({ where: { login_id } });
    if (existingUser) {
      throw new BadRequestException('이미 존재하는 아이디입니다.');
    }

    try{
    const hashedPassword = await bcrypt.hash(password, 10); // 비밀번호 해싱

    const user = this.userRepository.create({
      login_id,
      password: hashedPassword, // 해싱된 비밀번호 저장
      confirm_password: hashedPassword,
      name,
    });
    
    await this.userRepository.save(user); // UserAccount 저장
    
    const profile = this.profileRepository.create({
      ...profileData, // 남은 프로필 정보 저장
      userAccount: user,
    });
    await this.profileRepository.save(profile); // BusinessProfile 저장
    
    return { userId: user.user_id, message: '회원가입이 성공적으로 완료되었습니다.' };
    } catch {
      throw new BadRequestException('회원가입에 실패했습니다.');
    }
}

  // 로그인 로직
async login(loginDto: LoginDto): Promise<{ token: string; userId: number } | null> {
    // 사용자 조회
    const user = await this.userRepository.findOne({ where: { login_id: loginDto.login_id } });
  
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