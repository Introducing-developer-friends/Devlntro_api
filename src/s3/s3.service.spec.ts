import { Test, TestingModule } from '@nestjs/testing';
import { S3Service } from './s3.service';
import { ConfigService } from '@nestjs/config';
import { S3Client, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { BadRequestException } from '@nestjs/common';

// AWS SDK와 관련된 모듈들을 모킹 처리
jest.mock('@aws-sdk/client-s3');
jest.mock('@aws-sdk/lib-storage');

// ConfigService를 모킹하여 테스트 환경에서 사용
class MockConfigService extends ConfigService {
  private mockValues: { [key: string]: string } = {
    AWS_REGION: 'us-east-1',
    AWS_ACCESS_KEY_ID: 'mock-access-key-id',
    AWS_SECRET_ACCESS_KEY: 'mock-secret-access-key',
    AWS_S3_BUCKET_NAME: 'mock-bucket-name',
    CLOUDFRONT_DOMAIN: 'https://mock.cloudfront.net',
  };

  constructor() {
    super();
  }

  // 설정 값 반환 메서드
  get(key: string): any {
    return this.mockValues[key];
  }

  // 테스트용 설정 값 변경 메서드
  setMockValue(key: string, value: string | null) {
    if (value === null) {
      delete this.mockValues[key];
    } else {
      this.mockValues[key] = value;
    }
  }
}

// S3Service 유닛 테스트
describe('S3Service', () => {
  let service: S3Service;
  let mockS3Client;
  let mockUpload;
  let configService: MockConfigService;

  beforeEach(async () => {
    jest.clearAllMocks();

    // S3Client 모킹
    mockS3Client = {
      send: jest.fn().mockResolvedValue({}),
      destroy: jest.fn().mockResolvedValue(undefined),
    };

    (S3Client as jest.MockedClass<typeof S3Client>).mockImplementation(
      () => mockS3Client,
    );

    // Upload 모킹
    mockUpload = {
      done: jest.fn().mockResolvedValue(undefined),
    };

    (Upload as jest.MockedClass<typeof Upload>).mockImplementation(
      () => mockUpload,
    );

    // 테스트 모듈 설정
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        S3Service,
        {
          provide: ConfigService,
          useClass: MockConfigService,
        },
      ],
    }).compile();

    service = module.get<S3Service>(S3Service);
    configService = module.get<MockConfigService>(ConfigService);
    await service.onModuleInit();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  // 초기화 관련 테스트
  describe('initialization', () => {
    it('should properly initialize cloudFrontDomain', async () => {
      expect(service['cloudFrontDomain']).toBe('https://mock.cloudfront.net');
    });

    it('should throw error when AWS credentials are missing', async () => {
      configService.setMockValue('AWS_ACCESS_KEY_ID', null);

      const newService = new S3Service(configService);
      await expect(newService.onModuleInit()).rejects.toThrow();
    });

    it('should throw error when AWS region is missing', async () => {
      configService.setMockValue('AWS_REGION', null);

      const newService = new S3Service(configService);
      await expect(newService.onModuleInit()).rejects.toThrow();
    });
  });

  // 업로드 테스트
  describe('uploadFile', () => {
    const mockFile: Express.Multer.File = {
      fieldname: 'file',
      originalname: 'test.jpg',
      encoding: '7bit',
      mimetype: 'image/jpeg',
      buffer: Buffer.from('mock file content'),
      size: 1024,
      stream: null,
      destination: '',
      filename: '',
      path: '',
    };

    it('should successfully upload a file and return CloudFront URL', async () => {
      const key = 'test/image.jpg';
      const expectedUrl = 'https://mock.cloudfront.net/test/image.jpg';

      const result = await service.uploadFile(mockFile, key);

      expect(Upload).toHaveBeenCalledWith({
        client: expect.any(Object),
        params: {
          Bucket: 'mock-bucket-name',
          Key: key,
          Body: mockFile.buffer,
          ContentType: mockFile.mimetype,
        },
      });
      expect(mockUpload.done).toHaveBeenCalled();
      expect(result).toBe(expectedUrl);
    });

    it('should handle upload errors', async () => {
      mockUpload.done.mockRejectedValueOnce(new Error('Upload failed'));

      await expect(service.uploadFile(mockFile, 'test.jpg')).rejects.toThrow(
        'Upload failed',
      );
    });

    it('should throw error when file is null', async () => {
      await expect(service.uploadFile(null, 'test.jpg')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should handle missing mimetype', async () => {
      const fileWithoutMimetype = { ...mockFile, mimetype: undefined };
      const key = 'test/file';

      await service.uploadFile(fileWithoutMimetype, key);

      expect(Upload).toHaveBeenCalledWith(
        expect.objectContaining({
          params: expect.objectContaining({
            ContentType: 'application/octet-stream', // default content type
          }),
        }),
      );
    });

    it('should handle various CloudFront domain formats', async () => {
      const testCases = [
        [
          'https://cdn.example.com',
          'test.jpg',
          'https://cdn.example.com/test.jpg',
        ],
        [
          'http://cdn.example.com/',
          'test.jpg',
          'https://cdn.example.com/test.jpg',
        ],
        ['cdn.example.com', 'test.jpg', 'https://cdn.example.com/test.jpg'],
      ];

      for (const [domain, key, expected] of testCases) {
        configService.setMockValue('CLOUDFRONT_DOMAIN', domain);
        const newService = new S3Service(configService);
        await newService.onModuleInit();
        const result = await newService.uploadFile(mockFile, key);
        expect(result).toBe(expected);
      }
    });
  });

  // 삭제 테스트
  describe('deleteFile', () => {
    it('should successfully delete a file', async () => {
      const key = 'test/image.jpg';

      await service.deleteFile(key);

      expect(DeleteObjectCommand).toHaveBeenCalledWith({
        Bucket: 'mock-bucket-name',
        Key: key,
      });
      expect(mockS3Client.send).toHaveBeenCalled();
    });

    it('should handle delete errors', async () => {
      mockS3Client.send.mockRejectedValueOnce(new Error('Delete failed'));

      await expect(service.deleteFile('test.jpg')).rejects.toThrow(
        'Delete failed',
      );
    });

    it('should handle empty key', async () => {
      await expect(service.deleteFile('')).rejects.toThrow(BadRequestException);
    });

    it('should handle deletion of non-existent file', async () => {
      mockS3Client.send.mockRejectedValueOnce({ name: 'NoSuchKey' });

      await expect(service.deleteFile('non-existent.jpg')).rejects.toThrow();
    });

    it('should handle invalid key format', async () => {
      await expect(service.deleteFile('../invalid/path.jpg')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  // 라이프사이클 훅 테스트
  describe('lifecycle hooks', () => {
    it('should initialize S3 client on module init', async () => {
      await service.onModuleInit();

      expect(S3Client).toHaveBeenCalledWith({
        region: 'us-east-1',
        credentials: {
          accessKeyId: 'mock-access-key-id',
          secretAccessKey: 'mock-secret-access-key',
        },
      });
    });

    // 모듈 제거 시 S3 클라이언트가 정상적으로 해제되는지 테스트
    it('should destroy S3 client on module destroy', async () => {
      await service.onModuleDestroy();

      expect(mockS3Client.destroy).toHaveBeenCalled();
    });

    // 클라이언트가 초기화되지 않은 경우에도 모듈 제거가 처리되는지 테스트
    it('should handle module destroy when client is not initialized', async () => {
      service['s3Client'] = null;
      await expect(service.onModuleDestroy()).resolves.not.toThrow();
    });
  });
});
