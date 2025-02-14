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
  ApiTags,
  ApiBearerAuth,
  ApiOkResponse,
  ApiBadRequestResponse,
  ApiBody,
  ApiUnauthorizedResponse,
  ApiCreatedResponse,
} from '@nestjs/swagger';
import {
  RegisterResponse,
  LoginResponse,
  RefreshTokenResponse,
  LogoutResponse,
} from '../types/auth.type';
import { JwtAuthGuard } from './jwt-auth.guard';
import { ErrorMessageType } from '../enums/error.message.enum';
import {
  BadRequestResponse,
  BaseResponse,
  UnauthorizedResponse,
} from '../types/response.type';
import { CustomRequest } from '../types/request.type';
@ApiTags('auth')
@ApiBearerAuth()
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('check-id/:login_id')
  @ApiOperation({ summary: '아이디 중복 체크' })
  @ApiOkResponse({
    type: BaseResponse,
    description: '아이디 중복 체크 결과',
  })
  @ApiBadRequestResponse({
    status: HttpStatus.BAD_REQUEST,
    type: BadRequestResponse,
    description: ErrorMessageType.BAD_REQUEST,
  })
  @Get('check-id/:login_id')
  async checkId(@Param('login_id') login_id: string): Promise<BaseResponse> {
    const result = await this.authService.checkIdAvailability(login_id);
    return {
      statusCode: HttpStatus.OK,
      message: result.available
        ? '사용 가능한 아이디입니다.'
        : '이미 사용 중인 아이디입니다.',
    };
  }

  @Post('register')
  @ApiOperation({ summary: '회원가입' })
  @ApiBody({
    type: CreateUserDto,
    description: '회원가입 정보',
  })
  @ApiCreatedResponse({
    type: RegisterResponse,
    description: '회원가입 성공적으로 완료되었습니다.',
  })
  @ApiBadRequestResponse({
    type: BadRequestResponse,
    description: ErrorMessageType.BAD_REQUEST,
  })
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

  @Post('login')
  @ApiOperation({ summary: '로그인' })
  @ApiBody({
    type: LoginDto,
    description: '로그인 정보',
  })
  @ApiOkResponse({
    type: LoginResponse,
    description: '로그인 성공',
  })
  @ApiBadRequestResponse({
    type: BadRequestResponse,
    description: ErrorMessageType.BAD_REQUEST,
  })
  @ApiUnauthorizedResponse({
    type: UnauthorizedResponse,
    description: ErrorMessageType.INVALID_AUTH,
  })
  async login(@Body() loginDto: LoginDto): Promise<LoginResponse> {
    const result = await this.authService.login(loginDto);
    if (!result) {
      throw new UnauthorizedException(ErrorMessageType.INVALID_AUTH);
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
  @ApiOperation({ summary: '토큰 갱신' })
  @ApiBody({
    type: RefreshTokenDto,
    description: '리프레시 토큰',
  })
  @ApiOkResponse({
    type: RefreshTokenResponse,
    description: '토큰 갱신 성공',
  })
  @ApiBadRequestResponse({
    type: BadRequestResponse,
    description: ErrorMessageType.BAD_REQUEST,
  })
  @ApiUnauthorizedResponse({
    type: UnauthorizedResponse,
    description: ErrorMessageType.INVALID_TOKEN,
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
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: '로그아웃' })
  @ApiOkResponse({
    type: LogoutResponse,
    description: '로그아웃 성공',
  })
  @ApiBadRequestResponse({
    type: BadRequestResponse,
    description: ErrorMessageType.BAD_REQUEST,
  })
  @ApiUnauthorizedResponse({
    type: UnauthorizedResponse,
    description: ErrorMessageType.INVALID_AUTH,
  })
  async logout(@Req() req: CustomRequest): Promise<LogoutResponse> {
    await this.authService.logout(req.user.userId);

    return {
      statusCode: HttpStatus.OK,
      message: '로그아웃 성공',
    };
  }
}
