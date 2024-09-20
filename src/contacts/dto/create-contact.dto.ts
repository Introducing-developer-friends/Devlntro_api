import { IsString } from 'class-validator';

export class CreateContactDto {
  @IsString()
  login_id: string;
}