import { ApiProperty } from '@nestjs/swagger';

export class BaseResponse {
  @ApiProperty({ description: 'HTTP 상태 코드', example: 200 })
  statusCode: number;

  @ApiProperty({
    description: '응답 메시지',
    example: '요청이 성공적으로 처리되었습니다.',
  })
  message: string;
}

export class BadRequestResponse {
  @ApiProperty({ example: 400 })
  statusCode: number;

  @ApiProperty({ example: '잘못된 요청입니다.' })
  message: string;
}

export class UnauthorizedResponse {
  @ApiProperty({ example: 401 })
  statusCode: number;

  @ApiProperty({ example: '인증에 실패했습니다.' })
  message: string;

  @ApiProperty({ example: 'Unauthorized' })
  error: string;
}

export class NotFoundResponse {
  @ApiProperty({ example: 404 })
  statusCode: number;

  @ApiProperty({ example: '리소스를 찾을 수 없습니다.' })
  message: string;
}

export class ConflictResponse {
  @ApiProperty({ example: 409 })
  statusCode: number;

  @ApiProperty({ example: '이미 존재하는 리소스입니다.' })
  message: string;
}
