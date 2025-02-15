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
    '/favicon.ico',
    '/robots.txt',
    '/.env',
    '/.git',
    '.php',
    '.asp',
    '.aspx',
    '/static/',
    '/assets/',
    '/public/',
    '/css/',
    '/images/',
    '/Core/Skin/',
    '/console',
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
