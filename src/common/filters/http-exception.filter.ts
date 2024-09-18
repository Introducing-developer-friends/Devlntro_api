import { ExceptionFilter, Catch, ArgumentsHost, HttpException } from '@nestjs/common';
import { Request, Response } from 'express';

// HttpException 발생 시 처리할 필터 클래스 정의
@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  // 예외 발생 시 실행되는 메서드
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp(); // HTTP context로 변환
    const response = ctx.getResponse<Response>(); // 응답 객체 가져오기
    const request = ctx.getRequest<Request>(); // 요청 객체 가져오기
    const status = exception.getStatus(); // 예외 상태 코드 가져오기
    const errorMessage = exception.message; // 예외 메시지
    const errorName = exception.name; // 예외 이름 가져오기 (BadRequestException 등)

    // 예외에 대한 응답 전송
    response
      .status(status)
      .json({
        statusCode: status, // 상태 코드
        message: errorMessage, // 예외 메시지
        error: errorName || 'Bad Request', // 예외 이름 또는 기본 'Bad Request'
      });
  }
}
