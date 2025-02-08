import {
  Controller,
  Put,
  Delete,
  Body,
  UseGuards,
  Request,
  HttpStatus,
} from '@nestjs/common';
import { UserService } from './user.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UpdateBusinessProfileDto } from './dto/update-business-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { DeleteAccountDto } from './dto/delete-account.dto';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { Request as ExpressRequest } from 'express';
import {
  BusinessProfileResponse,
  PasswordChangeResponse,
  AccountDeleteResponse,
} from '../types/user.types';
interface CustomRequest extends ExpressRequest {
  user: {
    userId: number;
  };
}
@ApiTags('users')
@ApiBearerAuth()
@Controller('users')
@UseGuards(JwtAuthGuard)
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Put('businessprofile')
  @ApiOperation({ summary: '나의 명함 정보 수정' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '프로필 정보가 성공적으로 수정되었습니다.',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: '잘못된 요청입니다. 유효한 정보를 입력해주세요.',
  })
  async updateBusinessProfile(
    @Request() req: CustomRequest,
    @Body() updateProfileDto: UpdateBusinessProfileDto,
  ): Promise<BusinessProfileResponse> {
    const profile = await this.userService.updateBusinessProfile(
      req.user.userId,
      updateProfileDto,
    );

    return {
      statusCode: HttpStatus.OK,
      message: '프로필 정보가 성공적으로 수정되었습니다.',
      profile,
    };
  }

  @Put('password')
  @ApiOperation({ summary: '비밀번호 변경' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '비밀번호가 성공적으로 변경되었습니다.',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: '새 비밀번호와 확인 비밀번호가 일치하지 않습니다.',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: '현재 비밀번호가 올바르지 않습니다.',
  })
  async changePassword(
    @Request() req: CustomRequest,
    @Body() changePasswordDto: ChangePasswordDto,
  ): Promise<PasswordChangeResponse> {
    await this.userService.changePassword(req.user.userId, changePasswordDto);

    return {
      statusCode: HttpStatus.OK,
      message: '비밀번호가 성공적으로 변경되었습니다.',
    };
  }

  @Delete()
  @ApiOperation({ summary: '회원 탈퇴' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '회원 탈퇴가 성공적으로 처리되었습니다.',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: '회원 탈퇴 처리 중 오류가 발생했습니다.',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: '비밀번호가 올바르지 않습니다.',
  })
  async deleteAccount(
    @Request() req: CustomRequest,
    @Body() deleteAccountDto: DeleteAccountDto,
  ): Promise<AccountDeleteResponse> {
    await this.userService.deleteAccount(req.user.userId, deleteAccountDto);

    return {
      statusCode: HttpStatus.OK,
      message: '회원 탈퇴가 성공적으로 처리되었습니다.',
    };
  }
}
