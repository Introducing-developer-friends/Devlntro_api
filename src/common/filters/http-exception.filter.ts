import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { Logger } from '@nestjs/common';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  private readonly ignorePaths = [
    '/favicon.ico', // 브라우저 자동 요청
    '/robots.txt', // 검색엔진 봇 요청
    '/.env', // 환경설정 파일 스캔
    '/.git', // git 저장소 스캔
    '.php', // PHP 취약점 스캔
    '.asp', // ASP 취약점 스캔
    '.aspx', // ASPX 취약점 스캔
    '/static/', // 정적 파일 자동 요청
    '/assets/', // 정적 파일 자동 요청
    '/public/', // 정적 파일 자동 요청
    '/css/', // CSS 파일 자동 요청
    '/images/', // 이미지 파일 자동 요청
    '/Core/Skin/', // CMS 스캐닝
    '/console', // 콘솔 접근 시도
  ];

  private shouldLogError(status: number, url: string): boolean {
    if (status !== 404) return true;

    if (url.startsWith('/api/')) return true;

    return !this.ignorePaths.some((path) => url.includes(path));
  }

  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = exception.getStatus();

    const errorResponse = {
      statusCode: status,
      message: exception.message,
      error: exception.name || 'Bad Request',
      path: request.url,
      timestamp: new Date().toISOString(),
    };

    if (this.shouldLogError(status, request.url)) {
      this.logger.error(
        `${request.method} ${request.url}`,
        exception.stack,
        'HttpExceptionFilter',
      );
    }

    response.status(status).json(errorResponse);
  }
}
