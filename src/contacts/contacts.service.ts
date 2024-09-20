import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BusinessContact } from '../entities/business-contact.entity';
import { UserAccount } from '../entities/user-account.entity';
import { BusinessProfile } from '../entities/business-profile.entity';

@Injectable()
export class ContactsService {
  constructor(
    @InjectRepository(BusinessContact)
    private contactRepository: Repository<BusinessContact>,
    @InjectRepository(UserAccount)
    private userRepository: Repository<UserAccount>,
    @InjectRepository(BusinessProfile)
    private profileRepository: Repository<BusinessProfile>,
  ) {}

  // 사용자의 인맥 목록을 조회하는 메서드
  async getContactList(userId: number) {

    // userId에 해당하는 사용자의 모든 인맥을 조회
    // relations 옵션을 통해 연관된 contact_user와 그의 profile 정보도 함께 가져옴
    const contacts = await this.contactRepository.find({
      where: { userAccount: { user_id: userId } },
      relations: ['contact_user', 'contact_user.profile'],
    });

    // 인맥이 없는 경우 예외 처리
    if (contacts.length === 0) {
      throw new NotFoundException('명함 리스트를 찾을 수 없습니다.');
    }

    // 조회된 인맥 정보를 가공하여 반환
    return {
      statusCode: 200,
      message: '명함 리스트를 성공적으로 조회했습니다.',
      contacts: contacts.map(contact => ({
        userId: contact.contact_user.user_id,
        name: contact.contact_user.name,
        company: contact.contact_user.profile.company,
        department: contact.contact_user.profile.department,
      })),
    };
  }

  // 특정 인맥의 상세 정보를 조회하는 메서드
  async getContactDetail(userId: number, contactUserId: number) {

    // userId에 해당하는 사용자의 특정 인맥(contactUserId)을 조회
    const contact = await this.contactRepository.findOne({
      where: { 
        userAccount: { user_id: userId },
        contact_user: { user_id: contactUserId }
      },
      relations: ['contact_user', 'contact_user.profile'],
    });

    // 해당 인맥이 없는 경우 예외 처리
    if (!contact) {
      throw new NotFoundException('해당 사용자의 명함을 찾을 수 없습니다.');
    }

    // 조회된 인맥의 상세 정보를 반환
    return {
      statusCode: 200,
      message: '명함 상세 정보를 성공적으로 조회했습니다.',
      contact: {
        userId: contact.contact_user.user_id,
        name: contact.contact_user.name,
        company: contact.contact_user.profile.company,
        department: contact.contact_user.profile.department,
        position: contact.contact_user.profile.position,
        email: contact.contact_user.profile.email,
        phone: contact.contact_user.profile.phone,
      },
    };
  }

  // 새로운 인맥을 추가하는 메서드
  async addContact(userId: number, contactLoginId: string) {

    // 현재 사용자와 추가하려는 인맥의 사용자 정보를 조회
    const user = await this.userRepository.findOne({ where: { user_id: userId } });
    const contactUser = await this.userRepository.findOne({ where: { login_id: contactLoginId } });

    // 현재 사용자가 존재하지 않는 경우 예외 처리
    if (!user) {
      throw new BadRequestException('인증된 사용자를 찾을 수 없습니다.');
    }

    // 추가하려는 인맥이 존재하지 않는 경우 예외 처리
    if (!contactUser) {
      throw new BadRequestException('추가하려는 사용자를 찾을 수 없습니다.');
    }

    if (user.user_id === contactUser.user_id) {
      throw new BadRequestException('자기 자신을 인맥으로 추가할 수 없습니다.');
    }

    // 이미 인맥으로 등록된 사용자인지 확인
    const existingContact = await this.contactRepository.findOne({
      where: { 
        userAccount: { user_id: userId },
        contact_user: { user_id: contactUser.user_id }
      },
    });

    // 이미 인맥으로 등록된 경우 예외 처리
    if (existingContact) {
      throw new ConflictException('이미 인맥으로 등록된 사용자입니다.');
    }

    // 새로운 인맥 관계 생성
    const newContact = this.contactRepository.create({
      userAccount: user,
      contact_user: contactUser,
    });

    // 데이터베이스에 새로운 인맥 관계 저장
    await this.contactRepository.save(newContact);

    // 성공 응답 반환
    return {
      statusCode: 201,
      message: '인맥이 성공적으로 추가되었습니다.',
      contactId: newContact.contact_id,
    };
  }

  async deleteContact(userId: number, contactUserId: number) {
    console.log(`Attempting to delete contact. userId: ${userId}, contactUserId: ${contactUserId}`);
  
    const contact = await this.contactRepository.findOne({
      where: {
        userAccount: { user_id: userId },
        contact_user: { user_id: contactUserId }
      },
      relations: ['userAccount', 'contact_user']
    });
  
    console.log('Found contact:', contact);
  
    if (!contact) {
      throw new NotFoundException('해당 인맥을 찾을 수 없습니다.');
    }
  
    await this.contactRepository.remove(contact);
  
    console.log(`Contact successfully deleted. contactId: ${contact.contact_id}`);
  
    return {
      statusCode: 200,
      message: '인맥이 성공적으로 삭제되었습니다.',
    };
  }
}