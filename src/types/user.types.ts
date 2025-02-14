import { ApiProperty } from '@nestjs/swagger';
import { BaseResponse } from './response.type';

export class BusinessProfileInfo {
  @ApiProperty({ required: false, example: 'John Doe' })
  name?: string;

  @ApiProperty({ required: false, example: 'Tech Corp' })
  company?: string;

  @ApiProperty({ required: false, example: 'Engineering' })
  department?: string;

  @ApiProperty({ required: false, example: 'Software Engineer' })
  position?: string;

  @ApiProperty({ required: false, example: 'john@example.com' })
  email?: string;

  @ApiProperty({ required: false, example: '010-1234-5678' })
  phone?: string;
}

export interface UserPasswordInfo {
  currentPassword: string;
  newPassword: string;
  confirmNewPassword: string;
}

export interface UserDeleteInfo {
  password: string;
}

export class BusinessProfileResponse extends BaseResponse {
  @ApiProperty({ required: false, type: BusinessProfileInfo })
  profile?: BusinessProfileInfo;
}
