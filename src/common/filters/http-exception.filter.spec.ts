import { HttpException, HttpStatus, Logger } from '@nestjs/common';
import { HttpExceptionFilter } from './http-exception.filter';

describe('HttpExceptionFilter', () => {
  let filter: HttpExceptionFilter;
  let mockResponse;
  let mockJson;
  let mockStatus;
  let loggerErrorSpy;

  beforeEach(() => {
    mockJson = jest.fn().mockReturnThis();
    mockStatus = jest.fn().mockReturnValue({ json: mockJson });
    mockResponse = { status: mockStatus };

    filter = new HttpExceptionFilter();
    loggerErrorSpy = jest.spyOn(Logger.prototype, 'error').mockImplementation();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should log 500 errors', () => {
    const exception = new HttpException(
      'Server Error',
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
    const mockRequest = { url: '/test', method: 'GET' };
    const mockHost = {
      switchToHttp: () => ({
        getResponse: () => mockResponse,
        getRequest: () => mockRequest,
      }),
    };

    filter.catch(exception, mockHost as any);

    expect(loggerErrorSpy).toHaveBeenCalled();
    expect(mockStatus).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
  });

  it('should log 404 errors for API endpoints', () => {
    const exception = new HttpException('Not Found', HttpStatus.NOT_FOUND);
    const mockRequest = { url: '/api/users/123', method: 'GET' };
    const mockHost = {
      switchToHttp: () => ({
        getResponse: () => mockResponse,
        getRequest: () => mockRequest,
      }),
    };

    filter.catch(exception, mockHost as any);

    expect(loggerErrorSpy).toHaveBeenCalled();
    expect(mockStatus).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);
  });

  it('should not log 404 errors for ignored paths', () => {
    const exception = new HttpException('Not Found', HttpStatus.NOT_FOUND);
    const mockHost = {
      switchToHttp: () => ({
        getResponse: () => mockResponse,
        getRequest: () => ({ url: '/favicon.ico', method: 'GET' }),
      }),
    };

    filter.catch(exception, mockHost as any);

    expect(loggerErrorSpy).not.toHaveBeenCalled();
    expect(mockStatus).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);
  });

  it('should return correct error response format', () => {
    const errorMessage = 'Test Error';
    const exception = new HttpException(errorMessage, HttpStatus.BAD_REQUEST);
    const mockRequest = { url: '/test', method: 'GET' };
    const mockHost = {
      switchToHttp: () => ({
        getResponse: () => mockResponse,
        getRequest: () => mockRequest,
      }),
    };

    filter.catch(exception, mockHost as any);

    expect(mockJson).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: HttpStatus.BAD_REQUEST,
        message: errorMessage,
        error: 'HttpException',
        path: '/test',
      }),
    );
  });
});
