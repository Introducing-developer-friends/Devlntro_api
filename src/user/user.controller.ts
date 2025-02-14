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
  ApiBearerAuth,
  ApiBadRequestResponse,
  ApiUnauthorizedResponse,
  ApiOkResponse,
  ApiNotFoundResponse,
} from '@nestjs/swagger';

import { BusinessProfileResponse } from '../types/user.types';
import {
  BadRequestResponse,
  BaseResponse,
  NotFoundResponse,
  UnauthorizedResponse,
} from '../types/response.type';
import { ErrorMessageType } from '../enums/error.message.enum';
import { CustomRequest } from 'src/types/request.type';

@ApiTags('users')
@ApiBearerAuth()
@Controller('users')
@UseGuards(JwtAuthGuard)
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Put('businessprofile')
  @ApiOperation({ summary: '나의 명함 정보 수정' })
  @ApiOkResponse({
    type: BusinessProfileResponse,
    description: '프로필 정보가 성공적으로 수정되었습니다.',
  })
  @ApiBadRequestResponse({
    type: BadRequestResponse,
    description: ErrorMessageType.BAD_REQUEST,
  })
  @ApiUnauthorizedResponse({
    type: UnauthorizedResponse,
    description: ErrorMessageType.INVALID_AUTH,
  })
  @ApiNotFoundResponse({
    type: NotFoundResponse,
    description: ErrorMessageType.NOT_FOUND_PROFILE,
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
  @ApiOkResponse({
    type: BaseResponse,
    description: '비밀번호가 성공적으로 변경되었습니다.',
  })
  @ApiBadRequestResponse({
    type: BadRequestResponse,
    description: ErrorMessageType.BAD_REQUEST,
  })
  @ApiUnauthorizedResponse({
    type: UnauthorizedResponse,
    description: ErrorMessageType.INVALID_AUTH,
  })
  @ApiNotFoundResponse({
    type: NotFoundResponse,
    description: ErrorMessageType.NOT_FOUND_PASSWORD,
  })
  async changePassword(
    @Request() req: CustomRequest,
    @Body() changePasswordDto: ChangePasswordDto,
  ): Promise<BaseResponse> {
    await this.userService.changePassword(req.user.userId, changePasswordDto);

    return {
      statusCode: HttpStatus.OK,
      message: '비밀번호가 성공적으로 변경되었습니다.',
    };
  }

  @Delete()
  @ApiOperation({ summary: '회원 탈퇴' })
  @ApiOkResponse({
    type: BaseResponse,
    description: '회원 탈퇴가 성공적으로 처리되었습니다.',
  })
  @ApiBadRequestResponse({
    type: BadRequestResponse,
    description: ErrorMessageType.BAD_REQUEST,
  })
  @ApiUnauthorizedResponse({
    type: UnauthorizedResponse,
    description: ErrorMessageType.INVALID_AUTH,
  })
  async deleteAccount(
    @Request() req: CustomRequest,
    @Body() deleteAccountDto: DeleteAccountDto,
  ): Promise<BaseResponse> {
    await this.userService.deleteAccount(req.user.userId, deleteAccountDto);

    return {
      statusCode: HttpStatus.OK,
      message: '회원 탈퇴가 성공적으로 처리되었습니다.',
    };
  }
}
