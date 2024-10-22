import { Test, TestingModule } from '@nestjs/testing';
import { S3Service } from './s3.service';
import { ConfigService } from '@nestjs/config';
import { S3Client, DeleteObjectCommand } from '@aws-sdk/client-s3';

// S3Client와 DeleteObjectCommand 모듈을 jest.mock으로 모의 처리
jest.mock('@aws-sdk/client-s3', () => ({
  S3Client: jest.fn(() => ({
    send: jest.fn(),
    destroy: jest.fn(),
  })),
  DeleteObjectCommand: jest.fn(),
}));

// ConfigService의 모의 객체 설정
const mockConfigService = {
  get: jest.fn((key: string) => {
    switch (key) {
      case 'AWS_REGION':
        return 'us-east-1';
      case 'AWS_ACCESS_KEY_ID':
        return 'mock-access-key-id';
      case 'AWS_SECRET_ACCESS_KEY':
        return 'mock-secret-access-key';
      case 'AWS_S3_BUCKET_NAME':
        return 'mock-bucket-name';
      default:
        return null;
    }
  }),
};

describe('S3Service', () => {
  let service: S3Service;
  let s3ClientInstance: jest.Mocked<S3Client>;

  // 테스트가 실행되기 전에 각종 의존성 주입 및 초기화 작업을 수행
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        S3Service,
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<S3Service>(S3Service);
    // S3 클라이언트 초기화
    await service.onModuleInit();
    s3ClientInstance = (service as any).s3Client;
  });

  // S3Service가 정의되었는지 확인하는 기본 테스트
  it('should be defined', () => {
    expect(service).toBeDefined(); // S3Service가 존재하는지 확인
  });

  // S3에서 파일을 삭제하는 deleteFile 메서드 테스트
  describe('deleteFile', () => {
    it('should delete a file from S3', async () => {
      const key = 'uploads/mock-file.txt'; // 삭제할 파일의 키 값

      await service.deleteFile(key);

      // DeleteObjectCommand가 적절한 인수와 함께 호출되었는지 확인
      expect(DeleteObjectCommand).toHaveBeenCalledWith({
        Bucket: 'mock-bucket-name',
        Key: key,
      });
      // S3Client의 send 메서드가 호출되었는지 확인
      expect(s3ClientInstance.send).toHaveBeenCalled();
    });
  });

  // 모듈이 종료될 때 S3Client가 적절히 파괴되는지 테스트
  describe('onModuleDestroy', () => {
    it('should destroy S3 client on module destroy', async () => {
      await service.onModuleDestroy(); // 모듈 종료 시 destroy 호출

      // S3Client의 destroy 메서드가 호출되었는지 확인
      expect(s3ClientInstance.destroy).toHaveBeenCalled();
    });
  });
});