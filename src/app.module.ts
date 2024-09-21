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
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
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
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', '..', 'uploads'),
      serveRoot: '/posts/images/',
    }),
    AuthModule,
    FeedModule,
    PostModule,
    CommentModule,
    ContactsModule,
  ],
  controllers: [AppController, SampleController],
  providers: [AppService],
})
export class AppModule {}