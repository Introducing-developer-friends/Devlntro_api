import { Controller, Post, Body, Get, Param, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { AuthService } from './auth.service'; // AuthService 사용
import { CreateUserDto } from './dto/create-user.dto';
import { LoginDto } from './dto/login.dto';
import { ApiOperation, ApiResponse, ApiTags, ApiBearerAuth } from '@nestjs/swagger'; // Swagger 데코레이터 추가

@ApiTags('auth') // Swagger 태그 추가
@Controller('auth') // /auth 경로로 라우팅
export class AuthController {
  constructor(private authService: AuthService) {} // AuthService 의존성 주입

  @ApiOperation({ summary: 'Check ID availability' }) // API 설명
  @ApiResponse({
    status: 200,
    description: '사용 가능한 아이디 또는 이미 사용 중인 아이디 메시지를 반환합니다.',
  }) // 200 응답 설명
  @ApiResponse({
    status: 500,
    description: '서버 오류가 발생한 경우 메시지를 반환합니다.',
  }) // 500 응답 설명
  // 아이디 중복 확인 API (가드 적용 안 함)
  @Get('check-id/:login_id')
  async checkId(@Param('login_id') login_id: string) {
    const result = await this.authService.checkIdAvailability(login_id);
    return {
      statusCode: 200,
      message: result.message
    };
  }

  @ApiOperation({ summary: 'Register a new user' }) // API 설명
  @ApiResponse({
    status: 201,
    description: '회원가입이 성공적으로 완료되면 메시지와 userId를 반환합니다.',
  }) // 201 응답 설명
  @ApiResponse({
    status: 400,
    description: '회원가입 실패 시 오류 메시지를 반환합니다.',
  }) // 400 응답 설명
  @ApiResponse({
    status: 500,
    description: '서버 오류가 발생한 경우 메시지를 반환합니다.',
  }) // 500 응답 설명
  // 회원가입 API (가드 적용 안 함)
  @Post('register')
  async register(@Body() createUserDto: CreateUserDto) {
    try {
      const result = await this.authService.register(createUserDto);
      return {
        statusCode: 200,
        message: result.message,
        userId: result.userId
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @ApiOperation({ summary: 'Login' }) // API 설명
  @ApiResponse({
    status: 200,
    description: '로그인이 성공하면 JWT 토큰과 userId를 반환합니다.',
  }) // 200 응답 설명
  @ApiResponse({
    status: 401,
    description: '아이디 또는 비밀번호가 잘못되었을 때 401 상태 코드를 반환합니다.',
  }) // 401 응답 설명
  @ApiResponse({
    status: 500,
    description: '서버 오류가 발생한 경우 메시지를 반환합니다.',
  }) // 500 응답 설명
  // 로그인 API (가드 적용 안 함)
  @Post('login') // /auth/login 경로로 POST 요청을 받음
  async login(@Body() loginDto: LoginDto) {
    const result = await this.authService.login(loginDto);
    if (!result) {
      throw new UnauthorizedException('아이디 또는 비밀번호가 잘못되었습니다.');
    }
    return {
      statusCode: 200,
      message: '로그인 성공',
      token: result.token,
      userId: result.userId
    };
  }
}