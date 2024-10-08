import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ContactsController } from './contacts.controller';
import { ContactsService } from './contacts.service';
import { BusinessContact } from '../entities/business-contact.entity';
import { UserAccount } from '../entities/user-account.entity';
import { BusinessProfile } from '../entities/business-profile.entity';
import { FriendRequest } from '../entities/friend-request.entity';

@Module({
  imports: [TypeOrmModule.forFeature([BusinessContact, UserAccount, BusinessProfile, FriendRequest])],
  controllers: [ContactsController],
  providers: [ContactsService],
})
export class ContactsModule {}