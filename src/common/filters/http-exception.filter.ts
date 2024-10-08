import { ExceptionFilter, Catch, ArgumentsHost, HttpException } from '@nestjs/common';
import { Request, Response } from 'express';
import { Logger } from '@nestjs/common';

// HttpException 발생 시 처리할 필터 클래스 정의
@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  // Logger를 사용하여 필터 동작 시 로그를 기록
  private readonly logger = new Logger(HttpExceptionFilter.name);

  // 예외 발생 시 실행되는 메서드
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp(); // HTTP context로 변환
    const response = ctx.getResponse<Response>(); // 응답 객체 가져오기
    const request = ctx.getRequest<Request>(); // 요청 객체 가져오기
    const status = exception.getStatus(); // 예외 상태 코드 가져오기

    // 예외 응답에 포함할 정보를 구성
    const errorResponse = {
      statusCode: status, // 상태 코드
      message: exception.message, // 예외 메시지
      error: exception.name || 'Bad Request', // 예외 이름 또는 기본 'Bad Request'
      path: request.url, // 요청된 URL 경로
      timestamp: new Date().toISOString(), // 예외 발생 시간 (ISO 형식)
    };

    // 로그에 예외 발생 시의 요청 정보와 스택 트레이스 기록
    this.logger.error(
      `${request.method} ${request.url}`,  // 요청 메서드와 URL 정보
      exception.stack,  // 예외 스택 트레이스 정보
      'HttpExceptionFilter', // 로그 구분을 위한 필터 이름
    );

    // 클라이언트에게 예외 정보와 상태 코드 전송
    response.status(status).json(errorResponse);
  }
}
