import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  UnauthorizedException,
  BadRequestException,
  HttpStatus,
  UseGuards,
  Req,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateUserDto } from './dto/create-user.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import {
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiBearerAuth,
} from '@nestjs/swagger';
import {
  CheckIdResponse,
  RegisterResponse,
  LoginResponse,
  RefreshTokenResponse,
  LogoutResponse,
} from '../types/auth.type';
import { JwtAuthGuard } from './jwt-auth.guard';
@ApiTags('auth')
@ApiBearerAuth()
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @ApiOperation({ summary: '중복체크' })
  @ApiResponse({
    status: HttpStatus.OK,
    description:
      '사용 가능한 아이디 또는 이미 사용 중인 아이디 메시지를 반환합니다.',
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: '서버 오류가 발생한 경우 메시지를 반환합니다.',
  })
  @Get('check-id/:login_id')
  async checkId(@Param('login_id') login_id: string): Promise<CheckIdResponse> {
    const result = await this.authService.checkIdAvailability(login_id);
    return {
      statusCode: HttpStatus.OK,
      message: result.available
        ? '사용 가능한 아이디입니다.'
        : '이미 사용 중인 아이디입니다.',
    };
  }

  @ApiOperation({ summary: '회원가입' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: '회원가입이 성공적으로 완료되면 메시지와 userId를 반환합니다.',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: '회원가입 실패 시 오류 메시지를 반환합니다.',
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: '서버 오류가 발생한 경우 메시지를 반환합니다.',
  })
  @Post('register')
  async register(
    @Body() createUserDto: CreateUserDto,
  ): Promise<RegisterResponse> {
    try {
      const result = await this.authService.register(createUserDto);
      return {
        statusCode: HttpStatus.CREATED,
        message: '회원가입이 성공적으로 완료되었습니다.',
        userId: result.userId,
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @ApiOperation({ summary: '로그인' })
  @ApiResponse({
    status: HttpStatus.OK,
    description:
      '로그인 성공시 액세스 토큰, 리프레시 토큰과 사용자 ID를 반환합니다.',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description:
      '아이디 또는 비밀번호가 잘못되었을 때 401 상태 코드를 반환합니다.',
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: '서버 오류가 발생한 경우 메시지를 반환합니다.',
  })
  @Post('login')
  async login(@Body() loginDto: LoginDto): Promise<LoginResponse> {
    const result = await this.authService.login(loginDto);
    if (!result) {
      throw new UnauthorizedException('아이디 또는 비밀번호가 잘못되었습니다.');
    }
    return {
      statusCode: HttpStatus.OK,
      message: '로그인 성공',
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      userId: result.userId,
    };
  }

  @Post('refresh')
  @ApiOperation({ summary: '엑세스 토큰 갱신' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '토큰 갱신 성공시 새로운 엑세스 토큰을 반환합니다.',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: '리프레시 토큰이 유효하지 않을 때 401 상태 코드를 반환합니다.',
  })
  async refreshToken(
    @Body() refreshTokenDto: RefreshTokenDto,
  ): Promise<RefreshTokenResponse> {
    const result = await this.authService.refreshAccessToken(
      refreshTokenDto.refreshToken,
    );
    return {
      statusCode: HttpStatus.OK,
      message: '토큰 갱신 성공',
      accessToken: result.accessToken,
    };
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: '로그아웃' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '로그아웃 성공시 메시지를 반환합니다.',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: '인증되지 않은 사용자의 경우 401 상태 코드를 반환합니다.',
  })
  async logout(@Req() req: any): Promise<LogoutResponse> {
    await this.authService.logout(req.user.userId);

    return {
      statusCode: HttpStatus.OK,
      message: '로그아웃 성공',
    };
  }
}
