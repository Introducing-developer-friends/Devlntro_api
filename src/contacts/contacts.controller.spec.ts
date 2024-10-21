import { Test, TestingModule } from '@nestjs/testing';
import { ContactsController } from './contacts.controller';
import { ContactsService } from './contacts.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { BadRequestException, NotFoundException, ConflictException } from '@nestjs/common';

// ContactsService의 메서드를 모킹한 객체를 생성
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

describe('ContactsController', () => {
  let controller: ContactsController;
  let service: ContactsService;

  // 각 테스트 전 모듈을 설정하고 ContactsController와 ContactsService 인스턴스를 가져옴
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ContactsController], // ContactsController 설정
      providers: [
        { provide: ContactsService, useValue: mockContactsService },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    controller = module.get<ContactsController>(ContactsController);
    service = module.get<ContactsService>(ContactsService);
  });

  // 각 테스트 후에 모킹된 모든 함수 초기화
  afterEach(() => {
    jest.clearAllMocks();
  });

  // ContactsController가 제대로 정의되었는지 확인하는 테스트
  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  // getContactList 메서드에 대한 테스트
  describe('getContactList', () => {
    it('should return contact list', async () => {

      // 서비스에서 반환할 가짜 데이터를 설정
      const mockList = {
        statusCode: 200,
        message: '명함 리스트를 성공적으로 조회했습니다.',
        contacts: [{ userId: 1, name: 'John Doe', company: 'ABC Corp', department: 'Engineering' }],
      };
      mockContactsService.getContactList.mockResolvedValue(mockList);

      const req = { user: { userId: 1 } }; // 요청 객체 모킹
      const result = await controller.getContactList(req as any);

      // 결과와 서비스 메서드가 호출되었는지 확인
      expect(result).toEqual(mockList);
      expect(mockContactsService.getContactList).toHaveBeenCalledWith(1);
    });

    // 사용자의 정보가 없을 경우 BadRequestException이 발생하는지 확인하는 테스트
    it('should throw BadRequestException if user info is missing', async () => {
      const req = { user: {} }; // user 정보가 없는 요청
      await expect(controller.getContactList(req as any)).rejects.toThrow(BadRequestException);
    });
  });

  // getContactDetail 메서드에 대한 테스트
  describe('getContactDetail', () => {
    it('should return contact details', async () => {

      // 서비스에서 반환할 가짜 데이터를 설정
      const mockDetail = {
        statusCode: 200,
        message: '명함 상세 정보를 성공적으로 조회했습니다.',
        contact: {
          userId: 1,
          name: 'John Doe',
          company: 'ABC Corp',
          department: 'Engineering',
          position: 'Manager',
          email: 'john@example.com',
          phone: '123-456-7890',
        },
      };
      mockContactsService.getContactDetail.mockResolvedValue(mockDetail);

      const req = { user: { userId: 1 } }; // 요청 객체 모킹
      const result = await controller.getContactDetail(req as any, 2);

      // 결과와 서비스 메서드가 호출되었는지 확인
      expect(result).toEqual(mockDetail);
      expect(mockContactsService.getContactDetail).toHaveBeenCalledWith(1, 2);
    });

    // contact를 찾지 못할 경우 NotFoundException이 발생하는지 확인하는 테스트
    it('should throw NotFoundException if contact is not found', async () => {
      mockContactsService.getContactDetail.mockRejectedValue(new NotFoundException());
      const req = { user: { userId: 1 } };
      await expect(controller.getContactDetail(req as any, 999)).rejects.toThrow(NotFoundException);
    });
  });

  // addContactRequest 메서드에 대한 테스트
  describe('addContactRequest', () => {
    it('should add a new contact request', async () => {

      // 서비스에서 반환할 가짜 데이터를 설정
      const mockResponse = { statusCode: 201, message: '인맥 요청이 성공적으로 추가되었습니다.', requestId: 1 };
      mockContactsService.addContactRequest.mockResolvedValue(mockResponse);

      const req = { user: { userId: 1 } };
      const dto = { login_id: 'john_doe' };

      const result = await controller.addContactRequest(req as any, dto);
      expect(result).toEqual(mockResponse);
      expect(mockContactsService.addContactRequest).toHaveBeenCalledWith(1, 'john_doe');
    });

    // 유효하지 않은 요청일 때 BadRequestException이 발생하는지 확인하는 테스트
    it('should throw BadRequestException on invalid request', async () => {
      mockContactsService.addContactRequest.mockRejectedValue(new BadRequestException());
      const req = { user: { userId: 1 } };
      const dto = { login_id: 'invalid_user' };
      await expect(controller.addContactRequest(req as any, dto)).rejects.toThrow(BadRequestException);
    });

    // 이미 요청이 존재할 때 ConflictException이 발생하는지 확인하는 테스트
    it('should throw ConflictException if request already exists', async () => {
      mockContactsService.addContactRequest.mockRejectedValue(new ConflictException());
      const req = { user: { userId: 1 } };
      const dto = { login_id: 'existing_user' };
      await expect(controller.addContactRequest(req as any, dto)).rejects.toThrow(ConflictException);
    });
  });

  // acceptContactRequest 메서드에 대한 테스트
  describe('acceptContactRequest', () => {
    it('should accept a contact request', async () => {
      const mockResponse = { statusCode: 200, message: '인맥 요청이 수락되었습니다.' };
      mockContactsService.acceptContactRequest.mockResolvedValue(mockResponse);

      const req = { user: { userId: 1 } };
      const result = await controller.acceptContactRequest(req as any, 1);

      // 결과와 서비스 메서드 호출 여부 확인
      expect(result).toEqual(mockResponse);
      expect(mockContactsService.acceptContactRequest).toHaveBeenCalledWith(1, 1);
    });

    it('should throw NotFoundException if request is not found', async () => {
      mockContactsService.acceptContactRequest.mockRejectedValue(new NotFoundException());
      const req = { user: { userId: 1 } };
      await expect(controller.acceptContactRequest(req as any, 999)).rejects.toThrow(NotFoundException);
    });
  });

  // rejectContactRequest 메서드에 대한 테스트
  describe('rejectContactRequest', () => {
    it('should reject a contact request', async () => {
      const mockResponse = { statusCode: 200, message: '인맥 요청이 거절되었습니다.' };
      mockContactsService.rejectContactRequest.mockResolvedValue(mockResponse);

      const req = { user: { userId: 1 } };
      const result = await controller.rejectContactRequest(req as any, 1);

      // rejectContactRequest 메서드에 대한 테스트
      expect(result).toEqual(mockResponse);
      expect(mockContactsService.rejectContactRequest).toHaveBeenCalledWith(1, 1);
    });

    // 요청을 찾지 못할 때 NotFoundException이 발생하는지 확인하는 테스트
    it('should throw NotFoundException if request is not found', async () => {
      mockContactsService.rejectContactRequest.mockRejectedValue(new NotFoundException());
      const req = { user: { userId: 1 } };
      await expect(controller.rejectContactRequest(req as any, 999)).rejects.toThrow(NotFoundException);
    });
  });

  // getReceivedRequests 메서드에 대한 테스트
  describe('getReceivedRequests', () => {
    it('should return received requests', async () => {
      const mockResponse = {
        statusCode: 200,
        message: '받은 인맥 요청 목록을 성공적으로 조회했습니다.',
        requests: [{ requestId: 1, senderLoginId: 'user1', senderName: 'User One', requestedAt: new Date() }],
      };
      mockContactsService.getReceivedRequests.mockResolvedValue(mockResponse);

      const req = { user: { userId: 1 } };
      const result = await controller.getReceivedRequests(req as any);

      expect(result).toEqual(mockResponse);
      expect(mockContactsService.getReceivedRequests).toHaveBeenCalledWith(1);
    });
  });

  // getSentRequests 메서드에 대한 테스트
  describe('getSentRequests', () => {
    it('should return sent requests', async () => {
      const mockResponse = {
        statusCode: 200,
        message: '보낸 인맥 요청 목록을 성공적으로 조회했습니다.',
        requests: [{ requestId: 1, receiverLoginId: 'user2', receiverName: 'User Two', requestedAt: new Date() }],
      }; // 가짜 응답 데이터
      mockContactsService.getSentRequests.mockResolvedValue(mockResponse);

      const req = { user: { userId: 1 } };
      const result = await controller.getSentRequests(req as any);

      expect(result).toEqual(mockResponse);
      expect(mockContactsService.getSentRequests).toHaveBeenCalledWith(1);
    });
  });

  // deleteContact 메서드에 대한 테스트
  describe('deleteContact', () => {
    it('should delete a contact', async () => {
      const mockResponse = { statusCode: 200, message: '인맥이 성공적으로 삭제되었습니다.' };
      mockContactsService.deleteContact.mockResolvedValue(mockResponse);

      const req = { user: { userId: 1 } };
      const result = await controller.deleteContact(req as any, 2);

      // 결과와 서비스 메서드 호출 여부 확인
      expect(result).toEqual(mockResponse);
      expect(mockContactsService.deleteContact).toHaveBeenCalledWith(1, 2);
    });

    // contact를 찾지 못할 때 NotFoundException이 발생하는지 확인하는 테스트
    it('should throw NotFoundException if contact is not found', async () => {
      mockContactsService.deleteContact.mockRejectedValue(new NotFoundException());
      const req = { user: { userId: 1 } };
      await expect(controller.deleteContact(req as any, 999)).rejects.toThrow(NotFoundException);
    });
  });
});