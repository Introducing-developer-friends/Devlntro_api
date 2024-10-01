import { ApiProperty } from '@nestjs/swagger';

export class SampleDto {
  @ApiProperty({ example: 'John Doe', description: 'The name of the user' })
  name: string;

  @ApiProperty({ example: 25, description: 'The age of the user' })
  age: number;
}
