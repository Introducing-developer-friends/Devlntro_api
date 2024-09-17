import { Controller, Post, Body, Get, Param, UnauthorizedException, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service'; // AuthService 사용
import { CreateUserDto } from './dto/create-user.dto';
import { LoginDto } from './dto/login.dto';

@Controller('auth') // /auth 경로로 라우팅
export class AuthController {
  constructor(private authService: AuthService) {} // AuthService 의존성 주입

  // 아이디 중복 확인 API (가드 적용 안 함)
  @Get('check-id/:login_id')
  @UseGuards() // 가드를 비활성화
  async checkId(@Param('login_id') login_id: string) {
    const available = await this.authService.checkIdAvailability(login_id);
    return { available }; // 결과 반환
  }

  // 회원가입 API (가드 적용 안 함)
  @Post('register')
  @UseGuards() // 가드를 비활성화
  async register(@Body() createUserDto: CreateUserDto) {
    return this.authService.register(createUserDto); // AuthService의 회원가입 로직 호출
  }

  // 로그인 API (가드 적용 안 함)
  @Post('login') // /auth/login 경로로 POST 요청을 받음
  @UseGuards() // 가드를 비활성화
  async login(@Body() loginDto: LoginDto) {
    const result = await this.authService.login(loginDto); // AuthService의 로그인 로직 호출
    if (!result) {
      throw new UnauthorizedException('아이디 또는 비밀번호가 잘못되었습니다.');
    }
    return result;
  }
}