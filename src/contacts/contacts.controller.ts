import { Controller, Get, Post, Delete, Param, Body, UseGuards, Request, BadRequestException, NotFoundException } from '@nestjs/common';
import { ContactsService } from './contacts.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateContactDto } from './dto/create-contact.dto';

@Controller('contacts')
@UseGuards(JwtAuthGuard)
export class ContactsController {
  constructor(private readonly contactsService: ContactsService) {}

  @Get()
  async getContactList(@Request() req) {
    try {
      return await this.contactsService.getContactList(req.user.userId);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw new NotFoundException(error.message);
      }
      throw new BadRequestException('잘못된 요청입니다.');
    }
  }

  @Get(':userId')
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