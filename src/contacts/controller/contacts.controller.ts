import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  UseGuards,
  Request,
  HttpStatus,
} from '@nestjs/common';
import { ContactsService } from '../service/contacts.service';
import { JwtAuthGuard } from '../../jwt/jwt-auth.guard';
import { CreateContactDto } from '../dto/create-contact.dto';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiCreatedResponse,
  ApiConflictResponse,
  ApiOkResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

import {
  ContactDetailResponse,
  ContactListResponse,
  ContactRequestCreateResponse,
  ContactRequestUpdateResponse,
  ReceivedRequestListResponse,
  SentRequestListResponse,
} from '../../types/contacts.types';
import {
  BadRequestResponse,
  ConflictResponse,
  NotFoundResponse,
  UnauthorizedResponse,
} from '../../types/response.type';
import { ErrorMessageType } from '../../enums/error.message.enum';
import { CustomRequest } from '../../types/request.type';

@ApiTags('contacts')
@ApiBearerAuth()
@Controller('contacts')
@UseGuards(JwtAuthGuard)
export class ContactsController {
  constructor(private readonly contactsService: ContactsService) {}

  @Get()
  @ApiOperation({ summary: '명함 리스트 조회' })
  @ApiOkResponse({
    type: ContactListResponse,
    description: '명함 리스트를 성공적으로 조회했습니다.',
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
    description: ErrorMessageType.NOT_FOUND_CONTACT,
  })
  @Get()
  async getContactList(
    @Request() req: CustomRequest,
  ): Promise<ContactListResponse> {
    const contacts = await this.contactsService.getContactList(req.user.userId);

    return {
      statusCode: HttpStatus.OK,
      message:
        contacts.length > 0
          ? '명함 리스트를 성공적으로 조회했습니다.'
          : '등록된 명함이 없습니다.',
      contacts,
    };
  }

  @Get(':userId?')
  @ApiOperation({ summary: '명함 상세 정보 조회' })
  @ApiOkResponse({
    type: ContactDetailResponse,
    description: '명함 상세 정보를 성공적으로 조회했습니다.',
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
    description: ErrorMessageType.NOT_FOUND_CONTACT,
  })
  async getContactDetail(
    @Request() req: CustomRequest,
    @Param('userId') userId?: number,
  ): Promise<ContactDetailResponse> {
    const targetUserId = userId || req.user.userId;
    const contact = await this.contactsService.getContactDetail(
      req.user.userId,
      targetUserId,
    );

    return {
      statusCode: HttpStatus.OK,
      message: '명함 상세 정보를 성공적으로 조회했습니다.',
      contact,
    };
  }

  @Post()
  @ApiOperation({ summary: '인맥 추가 요청' })
  @ApiCreatedResponse({
    type: ContactRequestCreateResponse,
    description: '인맥 요청이 성공적으로 추가되었습니다.',
  })
  @ApiBadRequestResponse({
    type: BadRequestResponse,
    description: ErrorMessageType.BAD_REQUEST,
  })
  @ApiUnauthorizedResponse({
    type: UnauthorizedResponse,
    description: ErrorMessageType.INVALID_AUTH,
  })
  @ApiConflictResponse({
    type: ConflictResponse,
    description: ErrorMessageType.CONTACT_ALREADY_EXISTS,
  })
  async addContactRequest(
    @Request() req: CustomRequest,
    @Body() createContactDto: CreateContactDto,
  ): Promise<ContactRequestCreateResponse> {
    const result = await this.contactsService.addContactRequest(
      req.user.userId,
      createContactDto.login_id,
    );

    return {
      statusCode: HttpStatus.CREATED,
      message: '인맥 요청이 성공적으로 추가되었습니다.',
      requestId: result.requestId,
    };
  }

  @Post('accept/:requestId')
  @ApiOperation({ summary: '인맥 요청 수락' })
  @ApiOkResponse({
    type: ContactRequestUpdateResponse,
    description: '인맥 요청이 수락되었습니다.',
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
    description: ErrorMessageType.NOT_FOUND_REQUEST,
  })
  async acceptContactRequest(
    @Request() req: CustomRequest,
    @Param('requestId') requestId: number,
  ): Promise<ContactRequestUpdateResponse> {
    await this.contactsService.acceptContactRequest(req.user.userId, requestId);

    return {
      statusCode: HttpStatus.OK,
      message: '인맥 요청이 수락되었습니다.',
    };
  }

  @Post('reject/:requestId')
  @ApiOperation({ summary: '인맥 요청 거절' })
  @ApiOkResponse({
    type: ContactRequestUpdateResponse,
    description: '인맥 요청이 거절되었습니다.',
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
    description: ErrorMessageType.NOT_FOUND_REQUEST,
  })
  async rejectContactRequest(
    @Request() req: CustomRequest,
    @Param('requestId') requestId: number,
  ): Promise<ContactRequestUpdateResponse> {
    await this.contactsService.rejectContactRequest(req.user.userId, requestId);

    return {
      statusCode: HttpStatus.OK,
      message: '인맥 요청이 거절되었습니다.',
    };
  }

  @Get('requests/received')
  @ApiOperation({ summary: '받은 인맥 요청 목록 조회' })
  @ApiOkResponse({
    type: ReceivedRequestListResponse,
    description: '받은 인맥 요청 목록을 성공적으로 조회했습니다.',
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
    description: ErrorMessageType.NOT_FOUND_REQUESTS,
  })
  async getReceivedRequests(
    @Request() req: CustomRequest,
  ): Promise<ReceivedRequestListResponse> {
    const requests = await this.contactsService.getReceivedRequests(
      req.user.userId,
    );

    return {
      statusCode: HttpStatus.OK,
      message: '받은 인맥 요청 목록을 성공적으로 조회했습니다.',
      requests,
    };
  }

  @Get('requests/sent')
  @ApiOperation({ summary: '보낸 인맥 요청 목록 조회' })
  @ApiOkResponse({
    type: SentRequestListResponse,
    description: '보낸 인맥 요청 목록을 성공적으로 조회했습니다.',
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
    description: ErrorMessageType.NOT_FOUND_REQUESTS,
  })
  async getSentRequests(
    @Request() req: CustomRequest,
  ): Promise<SentRequestListResponse> {
    const requests = await this.contactsService.getSentRequests(
      req.user.userId,
    );

    return {
      statusCode: HttpStatus.OK,
      message: '보낸 인맥 요청 목록을 성공적으로 조회했습니다.',
      requests,
    };
  }

  @Delete(':contactId')
  @ApiOperation({ summary: '인맥 삭제 (명함 삭제)' })
  @ApiOkResponse({
    type: ContactRequestUpdateResponse,
    description: '인맥이 성공적으로 삭제되었습니다.',
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
    description: ErrorMessageType.NOT_FOUND_CONTACT,
  })
  async deleteContact(
    @Request() req: CustomRequest,
    @Param('contactId') contactUserId: number,
  ): Promise<ContactRequestUpdateResponse> {
    await this.contactsService.deleteContact(req.user.userId, contactUserId);

    return {
      statusCode: HttpStatus.OK,
      message: '인맥이 성공적으로 삭제되었습니다.',
    };
  }
}
