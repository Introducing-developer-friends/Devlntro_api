import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { DataSource } from 'typeorm';
import { SampleController } from './controllers/sample.controller';  // SampleController 임포트
import { AuthModule } from './auth/auth.module';
import { FeedModule } from './feed/feed.module';
import { PostModule } from './post/post.module'
import { CommentModule } from './comment/comment.module'
import { ContactsModule } from './contacts/contacts.module'
import { UserModule } from './user/user.module'
import { S3Module } from './s3/s3.module';
import { NotificationsModule } from './notification/notifications.module';
import { CacheModule } from '@nestjs/cache-manager';
@Module({
  imports: [
    // 환경 변수 설정을 로드하는 모듈. 기본적으로 .env 파일을 읽어들임.
    ConfigModule.forRoot(),

    // TypeORM 모듈 설정을 비동기 방식으로 초기화
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'mysql', // 데이터베이스 타입을 MySQL로 지정
        host: configService.get('DB_HOST'),
        port: +configService.get<number>('DB_PORT'),
        username: configService.get('DB_USERNAME'),
        password: configService.get('DB_PASSWORD'),
        database: configService.get('DB_DATABASE'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'], // 엔티티 경로 설정
        synchronize: false, // 애플리케이션 시작 시 데이터베이스 스키마를 자동으로 동기화할지 여부 (운영 환경에서는 false 권장)
      }),
      inject: [ConfigService], // ConfigService를 의존성 주입하여 설정값을 사용

      // 데이터베이스 연결을 위한 데이터 소스 생성
      dataSourceFactory: async (options) => {
        const dataSource = await new DataSource(options).initialize();
        return dataSource;
      },
    }),

    // CacheModule을 추가하여 캐시 기능 활성화
    CacheModule.register(),

    // 애플리케이션에 필요한 다양한 모듈을 임포트하여 의존성을 관리
    AuthModule,
    FeedModule,
    PostModule,
    CommentModule,
    ContactsModule,
    UserModule,
    S3Module,
    NotificationsModule,
  ],

  // 이 모듈에서 사용할 컨트롤러를 정의
  controllers: [AppController, SampleController],
  
  // 이 모듈에서 사용할 프로바이더(서비스)를 정의
  providers: [AppService],
})
export class AppModule {}