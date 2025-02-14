import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ContactsController } from './contacts.controller';
import { ContactsService } from './contacts.service';
import { BusinessContact } from './entity/business-contact.entity';
import { UserAccount } from '../user/entity/user-account.entity';
import { BusinessProfile } from '../user/entity/business-profile.entity';
import { FriendRequest } from './entity/friend-request.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      BusinessContact,
      UserAccount,
      BusinessProfile,
      FriendRequest,
    ]),
  ],
  controllers: [ContactsController],
  providers: [ContactsService],
})
export class ContactsModule {}
