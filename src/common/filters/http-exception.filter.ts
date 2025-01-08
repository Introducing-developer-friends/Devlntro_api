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

  // 무시할 경로 목록 (자동화 요청 및 스캐닝 시도 방지)
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
    // 1. 404가 아닌 모든 에러는 로깅 (500 등 서버 에러는 중요)
    if (status !== 404) return true;

    // 2. API 엔드포인트 관련 404는 로깅 (실제 서비스 로직 문제일 수 있음)
    if (url.startsWith('/api/')) return true;

    // 3. 무시할 패턴에 해당하는 404는 로깅하지 않음
    return !this.ignorePaths.some((path) => url.includes(path));
  }

  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = exception.getStatus(); // HTTP 상태 코드 가져오기

    const errorResponse = {
      statusCode: status,
      message: exception.message,
      error: exception.name || 'Bad Request',
      path: request.url,
      timestamp: new Date().toISOString(),
    };

    // 로깅이 필요한 경우만 로그 기록
    if (this.shouldLogError(status, request.url)) {
      this.logger.error(
        `${request.method} ${request.url}`,
        exception.stack,
        'HttpExceptionFilter',
      );
    }

    // 클라이언트에는 항상 응답
    response.status(status).json(errorResponse);
  }
}
