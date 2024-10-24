import { Controller, Post, Body, Get, Param, UnauthorizedException, BadRequestException, HttpStatus  } from '@nestjs/common';
import { AuthService } from './auth.service'; // AuthService 사용
import { CreateUserDto } from './dto/create-user.dto';
import { LoginDto } from './dto/login.dto';
import { ApiOperation, ApiResponse, ApiTags, ApiBearerAuth } from '@nestjs/swagger'; // Swagger 데코레이터 추가
// 응답 타입 정의
type CheckIdResponse = {
  statusCode: number;
  message: string;
};

type RegisterResponse = {
  statusCode: number;
  message: string;
  userId: number;
};

type LoginResponse = {
  statusCode: number;
  message: string;
  token: string;
  userId: number;
};
@ApiTags('auth') // Swagger 태그 추가
@ApiBearerAuth()
@Controller('auth') // /auth 경로로 라우팅
export class AuthController {
  constructor(private readonly authService: AuthService) {} // AuthService 의존성 주입

  @ApiOperation({ summary: 'Check ID availability' }) // API 설명
  @ApiResponse({
    status: HttpStatus.OK,
    description: '사용 가능한 아이디 또는 이미 사용 중인 아이디 메시지를 반환합니다.',
  }) // 200 응답 설명
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: '서버 오류가 발생한 경우 메시지를 반환합니다.',
  }) // 500 응답 설명
  // 아이디 중복 확인 API (가드 적용 안 함)
  @Get('check-id/:login_id')
  async checkId(@Param('login_id') login_id: string) : Promise<CheckIdResponse> {
    const result = await this.authService.checkIdAvailability(login_id);
    return {
      statusCode: HttpStatus.OK,
      message: result.available ? '사용 가능한 아이디입니다.' : '이미 사용 중인 아이디입니다.'
    };
  }

  @ApiOperation({ summary: 'Register a new user' }) // API 설명
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: '회원가입이 성공적으로 완료되면 메시지와 userId를 반환합니다.',
  }) // 201 응답 설명
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: '회원가입 실패 시 오류 메시지를 반환합니다.',
  }) // 400 응답 설명
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: '서버 오류가 발생한 경우 메시지를 반환합니다.',
  }) // 500 응답 설명
  // 회원가입 API (가드 적용 안 함)
  @Post('register')
  async register(@Body() createUserDto: CreateUserDto): Promise<RegisterResponse> {
    try {
      const result = await this.authService.register(createUserDto);
      return {
        statusCode: HttpStatus.CREATED,
        message: '회원가입이 성공적으로 완료되었습니다.',
        userId: result.userId
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @ApiOperation({ summary: 'Login' }) // API 설명
  @ApiResponse({
    status: HttpStatus.OK,
    description: '로그인이 성공하면 JWT 토큰과 userId를 반환합니다.',
  }) // 200 응답 설명
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: '아이디 또는 비밀번호가 잘못되었을 때 401 상태 코드를 반환합니다.',
  }) // 401 응답 설명
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: '서버 오류가 발생한 경우 메시지를 반환합니다.',
  }) // 500 응답 설명
  // 로그인 API (가드 적용 안 함)
  @Post('login') // /auth/login 경로로 POST 요청을 받음
  async login(@Body() loginDto: LoginDto): Promise<LoginResponse> {
    const result = await this.authService.login(loginDto);
    if (!result) {
      throw new UnauthorizedException('아이디 또는 비밀번호가 잘못되었습니다.');
    }
    return {
      statusCode: HttpStatus.OK,
      message: '로그인 성공',
      token: result.token,
      userId: result.userId
    };
  }
}