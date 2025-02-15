import { Test, TestingModule } from '@nestjs/testing';
import { ContactsController } from './contacts.controller';
import { ContactsService } from '../service/contacts.service';
import { JwtAuthGuard } from '../../jwt/jwt-auth.guard';
import {
  BadRequestException,
  NotFoundException,
  ConflictException,
  HttpStatus,
} from '@nestjs/common';
import {
  ContactDetailResponse,
  ContactListResponse,
  ContactRequestCreateResponse,
  ContactRequestUpdateResponse,
  ReceivedRequestListResponse,
  SentRequestListResponse,
} from 'src/types/contacts.types';

describe('ContactsController', () => {
  let controller: ContactsController;

  const mockContactsService = {
    getContactList: jest.fn(),
    getContactDetail: jest.fn(),
    addContactRequest: jest.fn(),
    acceptContactRequest: jest.fn(),
    rejectContactRequest: jest.fn(),
    getReceivedRequests: jest.fn(),
    getSentRequests: jest.fn(),
    deleteContact: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ContactsController],
      providers: [{ provide: ContactsService, useValue: mockContactsService }],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    controller = module.get<ContactsController>(ContactsController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getContactList', () => {
    const mockContacts = [
      {
        userId: 1,
        name: 'John Doe',
        company: 'ABC Corp',
        department: 'Engineering',
      },
    ];

    it('should return contact list when contacts exist', async () => {
      mockContactsService.getContactList.mockResolvedValue(mockContacts);

      const expectedResponse: ContactListResponse = {
        statusCode: HttpStatus.OK,
        message: '명함 리스트를 성공적으로 조회했습니다.',
        contacts: mockContacts,
      };

      const result = await controller.getContactList({
        user: { userId: 1 },
      });
      expect(result).toEqual(expectedResponse);
      expect(mockContactsService.getContactList).toHaveBeenCalledWith(1);
    });

    it('should return empty message when no contacts exist', async () => {
      mockContactsService.getContactList.mockResolvedValue([]);

      const expectedResponse: ContactListResponse = {
        statusCode: HttpStatus.OK,
        message: '등록된 명함이 없습니다.',
        contacts: [],
      };

      const result = await controller.getContactList({
        user: { userId: 1 },
      });
      expect(result).toEqual(expectedResponse);
    });
  });

  describe('getContactDetail', () => {
    const mockContact = {
      userId: 1,
      name: 'John Doe',
      company: 'ABC Corp',
      department: 'Engineering',
      position: 'Manager',
      email: 'john@example.com',
      phone: '123-456-7890',
    };

    it('should return contact details', async () => {
      mockContactsService.getContactDetail.mockResolvedValue(mockContact);

      const expectedResponse: ContactDetailResponse = {
        statusCode: HttpStatus.OK,
        message: '명함 상세 정보를 성공적으로 조회했습니다.',
        contact: mockContact,
      };

      const result = await controller.getContactDetail(
        { user: { userId: 1 } },
        2,
      );
      expect(result).toEqual(expectedResponse);
      expect(mockContactsService.getContactDetail).toHaveBeenCalledWith(1, 2);
    });

    it('should throw NotFoundException if contact is not found', async () => {
      mockContactsService.getContactDetail.mockRejectedValue(
        new NotFoundException(),
      );
      await expect(
        controller.getContactDetail({ user: { userId: 1 } }, 999),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('addContactRequest', () => {
    it('should add a new contact request', async () => {
      const mockResult = { requestId: 1 };
      mockContactsService.addContactRequest.mockResolvedValue(mockResult);

      const expectedResponse: ContactRequestCreateResponse = {
        statusCode: HttpStatus.CREATED,
        message: '인맥 요청이 성공적으로 추가되었습니다.',
        requestId: 1,
      };

      const result = await controller.addContactRequest(
        { user: { userId: 1 } },
        { login_id: 'john_doe' },
      );

      expect(result).toEqual(expectedResponse);
      expect(mockContactsService.addContactRequest).toHaveBeenCalledWith(
        1,
        'john_doe',
      );
    });

    it('should throw BadRequestException on invalid request', async () => {
      mockContactsService.addContactRequest.mockRejectedValue(
        new BadRequestException(),
      );

      await expect(
        controller.addContactRequest(
          { user: { userId: 1 } },
          {
            login_id: 'invalid_user',
          },
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw ConflictException if request already exists', async () => {
      mockContactsService.addContactRequest.mockRejectedValue(
        new ConflictException(),
      );

      await expect(
        controller.addContactRequest(
          { user: { userId: 1 } },
          {
            login_id: 'existing_user',
          },
        ),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('acceptContactRequest', () => {
    it('should accept a contact request', async () => {
      mockContactsService.acceptContactRequest.mockResolvedValue(undefined);

      const expectedResponse: ContactRequestUpdateResponse = {
        statusCode: HttpStatus.OK,
        message: '인맥 요청이 수락되었습니다.',
      };

      const result = await controller.acceptContactRequest(
        { user: { userId: 1 } },
        1,
      );
      expect(result).toEqual(expectedResponse);
      expect(mockContactsService.acceptContactRequest).toHaveBeenCalledWith(
        1,
        1,
      );
    });

    it('should throw NotFoundException if request is not found', async () => {
      mockContactsService.acceptContactRequest.mockRejectedValue(
        new NotFoundException(),
      );
      await expect(
        controller.acceptContactRequest({ user: { userId: 1 } }, 999),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('rejectContactRequest', () => {
    it('should reject a contact request', async () => {
      mockContactsService.rejectContactRequest.mockResolvedValue(undefined);

      const expectedResponse: ContactRequestUpdateResponse = {
        statusCode: HttpStatus.OK,
        message: '인맥 요청이 거절되었습니다.',
      };

      const result = await controller.rejectContactRequest(
        { user: { userId: 1 } },
        1,
      );
      expect(result).toEqual(expectedResponse);
      expect(mockContactsService.rejectContactRequest).toHaveBeenCalledWith(
        1,
        1,
      );
    });
  });

  describe('getReceivedRequests', () => {
    const mockRequests = [
      {
        requestId: 1,
        senderLoginId: 'user1',
        senderName: 'User One',
        requestedAt: new Date(),
      },
    ];

    it('should return received requests', async () => {
      mockContactsService.getReceivedRequests.mockResolvedValue(mockRequests);

      const expectedResponse: ReceivedRequestListResponse = {
        statusCode: HttpStatus.OK,
        message: '받은 인맥 요청 목록을 성공적으로 조회했습니다.',
        requests: mockRequests,
      };

      const result = await controller.getReceivedRequests({
        user: { userId: 1 },
      });
      expect(result).toEqual(expectedResponse);
      expect(mockContactsService.getReceivedRequests).toHaveBeenCalledWith(1);
    });
  });

  describe('getSentRequests', () => {
    const mockRequests = [
      {
        requestId: 1,
        receiverLoginId: 'user2',
        receiverName: 'User Two',
        requestedAt: new Date(),
      },
    ];

    it('should return sent requests', async () => {
      mockContactsService.getSentRequests.mockResolvedValue(mockRequests);

      const expectedResponse: SentRequestListResponse = {
        statusCode: HttpStatus.OK,
        message: '보낸 인맥 요청 목록을 성공적으로 조회했습니다.',
        requests: mockRequests,
      };

      const result = await controller.getSentRequests({
        user: { userId: 1 },
      });
      expect(result).toEqual(expectedResponse);
      expect(mockContactsService.getSentRequests).toHaveBeenCalledWith(1);
    });
  });

  describe('deleteContact', () => {
    it('should delete a contact', async () => {
      mockContactsService.deleteContact.mockResolvedValue(undefined);

      const expectedResponse: ContactRequestUpdateResponse = {
        statusCode: HttpStatus.OK,
        message: '인맥이 성공적으로 삭제되었습니다.',
      };

      const result = await controller.deleteContact({ user: { userId: 1 } }, 2);
      expect(result).toEqual(expectedResponse);
      expect(mockContactsService.deleteContact).toHaveBeenCalledWith(1, 2);
    });

    it('should throw NotFoundException if contact is not found', async () => {
      mockContactsService.deleteContact.mockRejectedValue(
        new NotFoundException(),
      );

      await expect(
        controller.deleteContact({ user: { userId: 1 } }, 999),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
