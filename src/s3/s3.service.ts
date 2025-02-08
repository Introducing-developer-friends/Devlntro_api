import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  BadRequestException,
} from '@nestjs/common';
import { S3Client, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { ConfigService } from '@nestjs/config';
import { Upload } from '@aws-sdk/lib-storage';

@Injectable()
export class S3Service implements OnModuleInit, OnModuleDestroy {
  private s3Client: S3Client;
  cloudFrontDomain: string;

  constructor(private configService: ConfigService) {
    const cloudFrontDomain =
      this.configService.get<string>('CLOUDFRONT_DOMAIN');
    if (!cloudFrontDomain) {
      throw new Error('CloudFront domain configuration is missing');
    }
    this.cloudFrontDomain = cloudFrontDomain;
  }

  async onModuleInit() {
    const accessKeyId = this.configService.get<string>('AWS_ACCESS_KEY_ID');
    const secretAccessKey = this.configService.get<string>(
      'AWS_SECRET_ACCESS_KEY',
    );
    const region = this.configService.get<string>('AWS_REGION');
    const bucketName = this.configService.get<string>('AWS_S3_BUCKET_NAME');

    if (!accessKeyId || !secretAccessKey) {
      throw new Error('AWS credentials are missing');
    }
    if (!region) {
      throw new Error('AWS region is missing');
    }
    if (!bucketName) {
      throw new Error('AWS S3 bucket name is missing');
    }

    this.initializeS3Client();
  }

  private initializeS3Client() {
    this.s3Client = new S3Client({
      region: this.configService.get<string>('AWS_REGION'),
      credentials: {
        accessKeyId: this.configService.get<string>('AWS_ACCESS_KEY_ID'),
        secretAccessKey: this.configService.get<string>(
          'AWS_SECRET_ACCESS_KEY',
        ),
      },
    });
  }

  async onModuleDestroy() {
    if (this.s3Client) {
      this.s3Client.destroy();
    }
  }

  private validateKey(key: string): void {
    if (!key || key.trim().length === 0) {
      throw new BadRequestException('File key cannot be empty');
    }
    if (key.includes('..') || key.startsWith('/')) {
      throw new BadRequestException('Invalid file key format');
    }
  }

  private validateFile(file: Express.Multer.File): void {
    if (!file) {
      throw new BadRequestException('File is required');
    }
    if (!file.buffer || file.buffer.length === 0) {
      throw new BadRequestException('File content is empty');
    }

    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      throw new BadRequestException(
        `File size exceeds limit (${maxSize / 1024 / 1024}MB)`,
      );
    }
  }

  async uploadFile(file: Express.Multer.File, key: string): Promise<string> {
    try {
      this.validateFile(file);
      this.validateKey(key);

      if (!this.s3Client) {
        this.initializeS3Client();
      }

      const upload = new Upload({
        client: this.s3Client,
        params: {
          Bucket: this.configService.get<string>('AWS_S3_BUCKET_NAME'),
          Key: key,
          Body: file.buffer,
          ContentType: file.mimetype || 'application/octet-stream',
        },
      });

      await upload.done();

      const domain = this.cloudFrontDomain
        .replace(/^https?:\/\//, '')
        .replace(/\/+$/, '');
      const cleanKey = key.replace(/^\/+/, '');
      return `https://${domain}/${cleanKey}`;
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }

      if (error.name === 'NoSuchBucket') {
        throw new Error('S3 bucket does not exist');
      }
      throw new Error(`Failed to upload file: ${error.message}`);
    }
  }

  async deleteFile(key: string): Promise<void> {
    try {
      this.validateKey(key);

      if (!this.s3Client) {
        this.initializeS3Client();
      }

      const command = new DeleteObjectCommand({
        Bucket: this.configService.get<string>('AWS_S3_BUCKET_NAME'),
        Key: key,
      });

      await this.s3Client.send(command);
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }

      if (error.name === 'NoSuchKey') {
        throw new BadRequestException('File does not exist');
      }
      throw new Error(`Failed to delete file: ${error.message}`);
    }
  }
}
