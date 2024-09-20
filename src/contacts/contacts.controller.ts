import { Controller, Get, Post, Delete, Param, Body, UseGuards, Request, BadRequestException, NotFoundException } from '@nestjs/common';
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
  @ApiOperation({ summary: '인맥 추가 (명함 추가)' })
  @ApiResponse({ status: 201, description: '인맥이 성공적으로 추가되었습니다.' })
  @ApiResponse({ status: 400, description: '유효하지 않은 사용자 ID입니다.' })
  @ApiResponse({ status: 409, description: '이미 인맥으로 등록된 사용자입니다.' })
  async addContact(@Request() req, @Body() createContactDto: CreateContactDto) {
    try {
      return await this.contactsService.addContact(req.user.userId, createContactDto.login_id);
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw new BadRequestException(error.message);
      }
      throw error;
    }
  }

  @Delete(':contactId')
  @ApiOperation({ summary: '인맥 삭제 (명함 삭제)' })
  @ApiResponse({ status: 200, description: '인맥이 성공적으로 삭제되었습니다.' })
  @ApiResponse({ status: 400, description: '유효하지 않은 인맥 ID입니다.' })
  @ApiResponse({ status: 404, description: '해당 인맥을 찾을 수 없습니다.' })
  async deleteContact(@Request() req, @Param('contactId') contactId: number) {
    try {
      return await this.contactsService.deleteContact(req.user.userId, contactId);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw new NotFoundException(error.message);
      }
      throw new BadRequestException('유효하지 않은 인맥 ID입니다.');
    }
  }
}