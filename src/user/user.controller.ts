// user.controller.ts
import { Controller, Put, Delete, Body, UseGuards, Request } from '@nestjs/common';
import { UserService } from './user.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UpdateBusinessProfileDto } from './dto/update-business-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { DeleteAccountDto } from './dto/delete-account.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { Request as ExpressRequest } from 'express';
interface CustomRequest extends ExpressRequest {
  user: {
    userId: number;
  };
}
@ApiTags('users')
@ApiBearerAuth()
@Controller('users')
@UseGuards(JwtAuthGuard) // 이 컨트롤러의 모든 엔드포인트에 JWT 인증 가드를 적용
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Put('businessprofile')
  @ApiOperation({ summary: '나의 명함 정보 수정' })
  @ApiResponse({ status: 200, description: '프로필 정보가 성공적으로 수정되었습니다.' })
  @ApiResponse({ status: 400, description: '잘못된 요청입니다. 유효한 정보를 입력해주세요.' })
  async updateBusinessProfile(@Request() req: CustomRequest, @Body() updateProfileDto: UpdateBusinessProfileDto) {
    return this.userService.updateBusinessProfile(req.user.userId, updateProfileDto);
  }

  @Put('password')
  @ApiOperation({ summary: '비밀번호 변경' })
  @ApiResponse({ status: 200, description: '비밀번호가 성공적으로 변경되었습니다.' })
  @ApiResponse({ status: 400, description: '새 비밀번호와 확인 비밀번호가 일치하지 않습니다.' })
  @ApiResponse({ status: 401, description: '현재 비밀번호가 올바르지 않습니다.' })
  async changePassword(@Request() req: CustomRequest, @Body() changePasswordDto: ChangePasswordDto) {
    
    // JWT 가드를 통해 인증된 사용자 정보(req.user.userId)를 사용하여 비밀번호 변경
    return this.userService.changePassword(req.user.userId, changePasswordDto);
  }

  @Delete()
  @ApiOperation({ summary: '회원 탈퇴' })
  @ApiResponse({ status: 200, description: '회원 탈퇴가 성공적으로 처리되었습니다.' })
  @ApiResponse({ status: 400, description: '회원 탈퇴 처리 중 오류가 발생했습니다.' })
  @ApiResponse({ status: 401, description: '비밀번호가 올바르지 않습니다.' })
  async deleteAccount(@Request() req: CustomRequest, @Body() deleteAccountDto: DeleteAccountDto) {
    return this.userService.deleteAccount(req.user.userId, deleteAccountDto);
  }

}