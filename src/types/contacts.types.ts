import { ApiProperty } from '@nestjs/swagger';
import { BaseResponse } from './response.type';

export class ContactListResult {
  @ApiProperty({ example: 1 })
  userId: number;

  @ApiProperty({ example: 'John Doe' })
  name: string;

  @ApiProperty({ example: 'Tech Corp' })
  company: string;

  @ApiProperty({ example: 'Engineering' })
  department: string;
}

export class ContactDetailResult {
  @ApiProperty({ example: 1 })
  userId: number;

  @ApiProperty({ example: 'John Doe' })
  name: string;

  @ApiProperty({ example: 'Tech Corp' })
  company: string;

  @ApiProperty({ example: 'Engineering' })
  department: string;

  @ApiProperty({ example: 'Software Engineer' })
  position: string;

  @ApiProperty({ example: 'john@example.com' })
  email: string;

  @ApiProperty({ example: '010-1234-5678' })
  phone: string;
}

export interface ContactRequestResult {
  requestId: number;
}

export class ReceivedRequestResult {
  @ApiProperty({ example: 1 })
  requestId: number;

  @ApiProperty({ example: 'sender_id' })
  senderLoginId: string;

  @ApiProperty({ example: 'John Doe' })
  senderName: string;

  @ApiProperty({ example: new Date() })
  requestedAt: Date;
}

export class SentRequestResult {
  @ApiProperty({ example: 1 })
  requestId: number;

  @ApiProperty({ example: 'receiver_id' })
  receiverLoginId: string;

  @ApiProperty({ example: 'Jane Doe' })
  receiverName: string;

  @ApiProperty({ example: new Date() })
  requestedAt: Date;
}

export class ContactListResponse extends BaseResponse {
  @ApiProperty({ type: [ContactListResult] })
  contacts: ContactListResult[];
}

export class ContactDetailResponse extends BaseResponse {
  @ApiProperty({ type: ContactDetailResult })
  contact: ContactDetailResult;
}

export class ContactRequestResponse extends BaseResponse {
  @ApiProperty({ example: 1 })
  requestId: number;
}

export class ReceivedRequestListResponse extends BaseResponse {
  @ApiProperty({ type: [ReceivedRequestResult] })
  requests: ReceivedRequestResult[];
}

export class SentRequestListResponse extends BaseResponse {
  @ApiProperty({ type: [SentRequestResult] })
  requests: SentRequestResult[];
}

export class ContactRequestCreateResponse extends BaseResponse {
  @ApiProperty({ example: 1 })
  requestId: number;
}

export class ContactRequestUpdateResponse extends BaseResponse {}
