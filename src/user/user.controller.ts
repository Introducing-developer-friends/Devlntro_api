// user.controller.ts
import { Controller, Put, Body, UseGuards, Request } from '@nestjs/common';
import { UserService } from './user.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UpdateBusinessProfileDto } from './dto/update-business-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';

@Controller('users')
@UseGuards(JwtAuthGuard) // 이 컨트롤러의 모든 엔드포인트에 JWT 인증 가드를 적용
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Put('businessprofile')
  async updateBusinessProfile(@Request() req, @Body() updateProfileDto: UpdateBusinessProfileDto) {
    return this.userService.updateBusinessProfile(req.user.userId, updateProfileDto);
  }

  @Put('password')
  async changePassword(@Request() req, @Body() changePasswordDto: ChangePasswordDto) {
    
    // JWT 가드를 통해 인증된 사용자 정보(req.user.userId)를 사용하여 비밀번호 변경
    return this.userService.changePassword(req.user.userId, changePasswordDto);
  }
}