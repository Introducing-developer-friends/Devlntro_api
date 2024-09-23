import { Controller, Get, Post, Delete, Param, Body, UseGuards, Request, BadRequestException, NotFoundException, ConflictException  } from '@nestjs/common';
import { ContactsService } from './contacts.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateContactDto } from './dto/create-contact.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('contacts')
@ApiBearerAuth()
@Controller('contacts')
@UseGuards(JwtAuthGuard)
export class ContactsController {
  constructor(private readonly contactsService: ContactsService) {}

  @Get()
  @ApiOperation({ summary: '명함 리스트 조회' })
  @ApiResponse({ status: 200, description: '명함 리스트를 성공적으로 조회했습니다.' })
  @ApiResponse({ status: 400, description: '잘못된 요청입니다.' })
  @ApiResponse({ status: 404, description: '명함 리스트를 찾을 수 없습니다.' })
  async getContactList(@Request() req) {
    console.log('User from request:', req.user); // 디버깅을 위한 로그
    try {
      if (!req.user || !req.user.userId) {
        throw new BadRequestException('유저 정보가 없습니다.');
      }
      return await this.contactsService.getContactList(req.user.userId);
    } catch (error) {
      console.error('Error in getContactList:', error); // 에러 로깅
      if (error instanceof NotFoundException) {
        throw new NotFoundException(error.message);
      } else if (error instanceof BadRequestException) {
        throw error;
      } else {
        throw new BadRequestException('잘못된 요청입니다.');
      }
    }
  }

  @Get(':userId')
  @ApiOperation({ summary: '명함 상세 정보 조회' })
  @ApiResponse({ status: 200, description: '명함 상세 정보를 성공적으로 조회했습니다.' })
  @ApiResponse({ status: 400, description: '유효하지 않은 사용자 ID입니다.' })
  @ApiResponse({ status: 404, description: '해당 사용자의 명함을 찾을 수 없습니다.' })
  async getContactDetail(@Request() req, @Param('userId') userId: number) {
    try {
      return await this.contactsService.getContactDetail(req.user.userId, userId);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw new NotFoundException(error.message);
      }
      throw new BadRequestException('유효하지 않은 사용자 ID입니다.');
    }
  }

  @Post()
  @ApiOperation({ summary: '인맥 추가 요청' })
  @ApiResponse({ status: 201, description: '인맥이 성공적으로 추가되었습니다.' })
  @ApiResponse({ status: 400, description: '유효하지 않은 사용자 ID입니다.' })
  @ApiResponse({ status: 409, description: '이미 인맥으로 등록된 사용자입니다.' })
  async addContactRequest(@Request() req, @Body() createContactDto: CreateContactDto) {
    try {
      return await this.contactsService.addContactRequest(req.user.userId, createContactDto.login_id);
    } catch (error) {
      if (error instanceof BadRequestException || error instanceof ConflictException) {
        throw error;
      }
      throw new BadRequestException('요청 처리 중 오류가 발생했습니다.');
    }
  }

  @Post('accept/:requestId')
  @ApiOperation({ summary: '인맥 요청 수락' })
  @ApiResponse({ status: 200, description: '인맥 요청이 수락되었습니다.' })
  @ApiResponse({ status: 400, description: '유효하지 않은 요청입니다.' })
  @ApiResponse({ status: 404, description: '해당 인맥 요청을 찾을 수 없습니다.' })
  async acceptContactRequest(@Request() req, @Param('requestId') requestId: number) {
    try {
      return await this.contactsService.acceptContactRequest(req.user.userId, requestId);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('유효하지 않은 요청입니다.');
    }
  }

  @Post('reject/:requestId')
  @ApiOperation({ summary: '인맥 요청 거절' })
  @ApiResponse({ status: 200, description: '인맥 요청이 거절되었습니다.' })
  @ApiResponse({ status: 400, description: '유효하지 않은 요청입니다.' })
  @ApiResponse({ status: 404, description: '해당 인맥 요청을 찾을 수 없습니다.' })
  async rejectContactRequest(@Request() req, @Param('requestId') requestId: number) {
    try {
      return await this.contactsService.rejectContactRequest(req.user.userId, requestId);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('유효하지 않은 요청입니다.');
    }
  }

  @Get('requests/received')
  @ApiOperation({ summary: '받은 인맥 요청 목록 조회' })
  @ApiResponse({ status: 200, description: '받은 인맥 요청 목록을 성공적으로 조회했습니다.' })
  @ApiResponse({ status: 400, description: '요청 처리 중 오류가 발생했습니다.' })
  async getReceivedRequests(@Request() req) {
    try {
      return await this.contactsService.getReceivedRequests(req.user.userId);
    } catch (error) {
      throw new BadRequestException('요청 처리 중 오류가 발생했습니다.');
    }
  }

  @Get('requests/sent')
  @ApiOperation({ summary: '보낸 인맥 요청 목록 조회' })
  @ApiResponse({ status: 200, description: '보낸 인맥 요청 목록을 성공적으로 조회했습니다.' })
  @ApiResponse({ status: 400, description: '요청 처리 중 오류가 발생했습니다.' })
  async getSentRequests(@Request() req) {
    try {
      return await this.contactsService.getSentRequests(req.user.userId);
    } catch (error) {
      throw new BadRequestException('요청 처리 중 오류가 발생했습니다.');
    }
  }

  @Delete(':contactId')
  @ApiOperation({ summary: '인맥 삭제 (명함 삭제)' })
  @ApiResponse({ status: 200, description: '인맥이 성공적으로 삭제되었습니다.' })
  @ApiResponse({ status: 400, description: '유효하지 않은 인맥 ID입니다.' })
  @ApiResponse({ status: 404, description: '해당 인맥을 찾을 수 없습니다.' })
  async deleteContact(@Request() req, @Param('contactUserId') contactUserId: number) {
    try {
      return await this.contactsService.deleteContact(req.user.userId, contactUserId);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw new NotFoundException(error.message);
      }
      throw new BadRequestException('유효하지 않은 인맥 사용자 ID입니다.');
    }
  }
}