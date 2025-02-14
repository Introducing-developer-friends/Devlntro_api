import { Test, TestingModule } from '@nestjs/testing';
import { S3Service } from './s3.service';
import { ConfigService } from '@nestjs/config';
import { S3Client, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { BadRequestException } from '@nestjs/common';

jest.mock('@aws-sdk/client-s3');
jest.mock('@aws-sdk/lib-storage');

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

  get(key: string): any {
    return this.mockValues[key];
  }

  setMockValue(key: string, value: string | null) {
    if (value === null) {
      delete this.mockValues[key];
    } else {
      this.mockValues[key] = value;
    }
  }
}

describe('S3Service', () => {
  let service: S3Service;
  let mockS3Client;
  let mockUpload;
  let configService: MockConfigService;

  beforeEach(async () => {
    jest.clearAllMocks();

    mockS3Client = {
      send: jest.fn().mockResolvedValue({}),
      destroy: jest.fn().mockResolvedValue(undefined),
    };

    (S3Client as jest.MockedClass<typeof S3Client>).mockImplementation(
      () => mockS3Client,
    );

    mockUpload = {
      done: jest.fn().mockResolvedValue(undefined),
    };

    (Upload as jest.MockedClass<typeof Upload>).mockImplementation(
      () => mockUpload,
    );

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
            ContentType: 'application/octet-stream',
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

    it('should destroy S3 client on module destroy', async () => {
      await service.onModuleDestroy();

      expect(mockS3Client.destroy).toHaveBeenCalled();
    });

    it('should handle module destroy when client is not initialized', async () => {
      service['s3Client'] = null;
      await expect(service.onModuleDestroy()).resolves.not.toThrow();
    });
  });
});
