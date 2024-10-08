import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { ConfigService } from '@nestjs/config';
import { Upload } from '@aws-sdk/lib-storage';

@Injectable()
export class S3Service implements OnModuleInit, OnModuleDestroy {
  // S3Client 인스턴스를 저장할 변수
  private s3Client: S3Client;

  // ConfigService를 주입받아 AWS 설정을 불러옴
  constructor(private configService: ConfigService) {}

  // 모듈이 초기화될 때 S3 클라이언트를 초기화
  async onModuleInit() {
    this.initializeS3Client();
  }

  // S3 클라이언트를 초기화하는 메서드
  // AWS 설정을 가져와 S3Client 인스턴스를 생성
  private initializeS3Client() {
    this.s3Client = new S3Client({
      region: this.configService.get<string>('AWS_REGION'),
      credentials: {
        accessKeyId: this.configService.get<string>('AWS_ACCESS_KEY_ID'),
        secretAccessKey: this.configService.get<string>('AWS_SECRET_ACCESS_KEY'),
      },
    });
  }

  // 모듈이 종료될 때 S3 클라이언트를 파괴하여 리소스 해제
  async onModuleDestroy() {
    if (this.s3Client) {
      await this.s3Client.destroy();
    }
  }

  // 파일을 S3에 업로드하는 메서드
  // file: 업로드할 파일, key: S3 버킷 내 저장 경로
  async uploadFile(file: Express.Multer.File, key: string): Promise<string> {
    // 만약 S3 클라이언트가 초기화되지 않았다면 초기화 진행
    if (!this.s3Client) {
      this.initializeS3Client();
    }

    // S3에 파일 업로드 작업을 설정하고 스트림 방식으로 전송
    const upload = new Upload({
      client: this.s3Client,
      params: {
        Bucket: this.configService.get<string>('AWS_S3_BUCKET_NAME'),
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
      },
    });

    await upload.done(); // 파일 업로드 완료까지 대기
    
    // 업로드한 파일의 S3 URL 반환
    return `https://${this.configService.get<string>('AWS_S3_BUCKET_NAME')}.s3.${this.configService.get<string>('AWS_REGION')}.amazonaws.com/${key}`;
  }

  async deleteFile(key: string): Promise<void> {
    // 만약 S3 클라이언트가 초기화되지 않았다면 초기화 진행
    if (!this.s3Client) {
      this.initializeS3Client();
    }

    // 삭제 작업을 위한 명령 생성
    const command = new DeleteObjectCommand({
      Bucket: this.configService.get<string>('AWS_S3_BUCKET_NAME'),
      Key: key,
    });

    // S3에 파일 삭제 명령을 전송
    await this.s3Client.send(command);
  }
}