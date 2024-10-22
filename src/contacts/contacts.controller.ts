import { Controller, Get, Post, Delete, Param, Body, UseGuards, Request, HttpStatus  } from '@nestjs/common';
import { ContactsService } from './contacts.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateContactDto } from './dto/create-contact.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { Request as ExpressRequest } from 'express';
import { ContactResponse } from '../types/contacts.types';

interface CustomRequest extends ExpressRequest {
  user: {
    userId: number;
  };
}

@ApiTags('contacts')
@ApiBearerAuth()
@Controller('contacts')
@UseGuards(JwtAuthGuard)
export class ContactsController {
  constructor(private readonly contactsService: ContactsService) {}

  @Get()
  @ApiOperation({ summary: '명함 리스트 조회' })
  @ApiResponse({ status: HttpStatus.OK, description: '명함 리스트를 성공적으로 조회했습니다.' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: '잘못된 요청입니다.' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: '명함 리스트를 찾을 수 없습니다.' })
  @Get()
async getContactList(@Request() req: CustomRequest): Promise<ContactResponse> {
  const contacts = await this.contactsService.getContactList(req.user.userId);
  
  return {
    statusCode: HttpStatus.OK,
    message: contacts.length > 0 
      ? '명함 리스트를 성공적으로 조회했습니다.' 
      : '등록된 명함이 없습니다.',
    contacts
  };
}

  @Get(':userId?')
  @ApiOperation({ summary: '명함 상세 정보 조회' })  
  @ApiResponse({ status: HttpStatus.OK, description: '명함 상세 정보를 성공적으로 조회했습니다.' })  
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: '유효하지 않은 사용자 ID입니다.' })  
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: '해당 사용자의 명함을 찾을 수 없습니다.' })
  async getContactDetail(
    @Request() req: CustomRequest, 
    @Param('userId') userId?: number
  ): Promise<ContactResponse> {
    const targetUserId = userId || req.user.userId;
    const contact = await this.contactsService.getContactDetail(req.user.userId, targetUserId);

    return {
      statusCode: HttpStatus.OK,
      message: '명함 상세 정보를 성공적으로 조회했습니다.',
      contact
    };
  }

  @Post()
  @ApiOperation({ summary: '인맥 추가 요청' })
  @ApiResponse({ status: HttpStatus.CREATED, description: '인맥이 성공적으로 추가되었습니다.' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: '유효하지 않은 사용자 ID입니다.' })
  @ApiResponse({ status: HttpStatus.CONFLICT, description: '이미 인맥으로 등록된 사용자입니다.' })
  async addContactRequest(
    @Request() req: CustomRequest, 
    @Body() createContactDto: CreateContactDto
  ): Promise<ContactResponse> {
    const result = await this.contactsService.addContactRequest(
      req.user.userId, 
      createContactDto.login_id
    );

    return {
      statusCode: HttpStatus.CREATED,
      message: '인맥 요청이 성공적으로 추가되었습니다.',
      requestId: result.requestId
    };
  }

  @Post('accept/:requestId')
  @ApiOperation({ summary: '인맥 요청 수락' })
  @ApiResponse({ status: HttpStatus.OK, description: '인맥 요청이 수락되었습니다.' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: '유효하지 않은 요청입니다.' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: '해당 인맥 요청을 찾을 수 없습니다.' })
  async acceptContactRequest(
    @Request() req: CustomRequest,
    @Param('requestId') requestId: number
  ): Promise<ContactResponse> {
    await this.contactsService.acceptContactRequest(req.user.userId, requestId);
    
    return {
      statusCode: HttpStatus.OK,
      message: '인맥 요청이 수락되었습니다.'
    };
  }

  @Post('reject/:requestId')
  @ApiOperation({ summary: '인맥 요청 거절' })
  @ApiResponse({ status: HttpStatus.OK, description: '인맥 요청이 거절되었습니다.' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: '유효하지 않은 요청입니다.' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: '해당 인맥 요청을 찾을 수 없습니다.' })
  async rejectContactRequest(
    @Request() req: CustomRequest,
    @Param('requestId') requestId: number
  ): Promise<ContactResponse> {
    await this.contactsService.rejectContactRequest(req.user.userId, requestId);
    
    return {
      statusCode: HttpStatus.OK,
      message: '인맥 요청이 거절되었습니다.'
    };
  }

  @Get('requests/received')
  @ApiOperation({ summary: '받은 인맥 요청 목록 조회' })
  @ApiResponse({ status: HttpStatus.OK, description: '받은 인맥 요청 목록을 성공적으로 조회했습니다.' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: '요청 처리 중 오류가 발생했습니다.' })
  async getReceivedRequests(
    @Request() req: CustomRequest
  ): Promise<ContactResponse> {
    const requests = await this.contactsService.getReceivedRequests(req.user.userId);
    
    return {
      statusCode: HttpStatus.OK,
      message: '받은 인맥 요청 목록을 성공적으로 조회했습니다.',
      requests
    };
  }

  @Get('requests/sent')
  @ApiOperation({ summary: '보낸 인맥 요청 목록 조회' })
  @ApiResponse({ status: HttpStatus.OK, description: '보낸 인맥 요청 목록을 성공적으로 조회했습니다.' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: '요청 처리 중 오류가 발생했습니다.' })
  async getSentRequests(
    @Request() req: CustomRequest
  ): Promise<ContactResponse> {
    const requests = await this.contactsService.getSentRequests(req.user.userId);
    
    return {
      statusCode: HttpStatus.OK,
      message: '보낸 인맥 요청 목록을 성공적으로 조회했습니다.',
      requests
    };
  }

  @Delete(':contactId')
  @ApiOperation({ summary: '인맥 삭제 (명함 삭제)' })
  @ApiResponse({ status: HttpStatus.OK, description: '인맥이 성공적으로 삭제되었습니다.' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: '유효하지 않은 인맥 ID입니다.' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: '해당 인맥을 찾을 수 없습니다.' })
  async deleteContact(
    @Request() req: CustomRequest,
    @Param('contactUserId') contactUserId: number
  ): Promise<ContactResponse> {
    await this.contactsService.deleteContact(req.user.userId, contactUserId);
    
    return {
      statusCode: HttpStatus.OK,
      message: '인맥이 성공적으로 삭제되었습니다.'
    };
  }
}