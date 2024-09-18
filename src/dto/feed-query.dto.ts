import { IsEnum, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum SortOption {
  LATEST = 'latest',
  LIKES = 'likes',
  COMMENTS = 'comments',
}

export class FeedQueryDto {
  @ApiProperty({ enum: SortOption, required: false, default: SortOption.LATEST })
  @IsEnum(SortOption)
  @IsOptional()
  sort?: SortOption = SortOption.LATEST;
}
