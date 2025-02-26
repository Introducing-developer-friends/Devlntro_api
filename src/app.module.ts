import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { DataSource } from 'typeorm';
import { AuthModule } from './auth/auth.module';
import { FeedModule } from './feed/feed.module';
import { PostModule } from './post/post.module';
import { CommentModule } from './comment/comment.module';
import { ContactsModule } from './contacts/contacts.module';
import { UserModule } from './user/user.module';
import { S3Module } from './s3/s3.module';
import { NotificationsModule } from './notification/notifications.module';
import { CacheModule } from '@nestjs/cache-manager';
@Module({
  imports: [
    ConfigModule.forRoot(),

    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'mysql',
        host: configService.get('DB_HOST'),
        port: +configService.get<number>('DB_PORT'),
        username: configService.get('DB_USERNAME'),
        password: configService.get('DB_PASSWORD'),
        database: configService.get('DB_DATABASE'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        synchronize: false,
      }),
      inject: [ConfigService],

      dataSourceFactory: async (options) => {
        const dataSource = await new DataSource(options).initialize();
        return dataSource;
      },
    }),

    CacheModule.register(),

    AuthModule,
    FeedModule,
    PostModule,
    CommentModule,
    ContactsModule,
    UserModule,
    S3Module,
    NotificationsModule,
  ],

  controllers: [AppController],

  providers: [AppService],
})
export class AppModule {}
