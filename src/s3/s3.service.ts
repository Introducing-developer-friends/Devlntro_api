import { Injectable } from '@nestjs/common';
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class S3Service {
  private s3Client: S3Client;

  constructor(private configService: ConfigService) {

    // S3 클라이언트 초기화
    this.s3Client = new S3Client({
      region: this.configService.get<string>('AWS_REGION'),
      credentials: {
        accessKeyId: this.configService.get<string>('AWS_ACCESS_KEY_ID'),
        secretAccessKey: this.configService.get<string>('AWS_SECRET_ACCESS_KEY'),
      },
    });
  }

  // S3Client 반환
  getS3Client(): S3Client {
    return this.s3Client;
  }

  // 파일 업로드
  async uploadFile(file: Express.Multer.File, key: string): Promise<string> {
    const command = new PutObjectCommand({
      Bucket: this.configService.get<string>('AWS_S3_BUCKET_NAME'),
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
    });
  
    try {
        await this.s3Client.send(command);
        // 업로드된 파일의 URL 생성 및 반환
        return `https://${this.configService.get<string>('AWS_S3_BUCKET_NAME')}.s3.${this.configService.get<string>('AWS_REGION')}.amazonaws.com/${key}`;
    } catch (error) {
      throw new Error(`파일 업로드 중 오류 발생: ${error.message}`);
    }
  }

  // 파일 삭제
  async deleteFile(key: string): Promise<void> {
    const command = new DeleteObjectCommand({
      Bucket: this.configService.get<string>('AWS_S3_BUCKET_NAME'),
      Key: key,
    });

    await this.s3Client.send(command);
  }

  // S3 버킷 이름 반환
  getBucketName(): string {
    return this.configService.get<string>('AWS_S3_BUCKET_NAME');
  }
}
