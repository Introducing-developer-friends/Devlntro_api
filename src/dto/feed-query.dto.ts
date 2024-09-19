import { IsEnum, IsOptional, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

export enum SortOption {
  LATEST = 'latest',
  LIKES = 'likes',
  COMMENTS = 'comments',
}

export enum FilterType {
  ALL = 'all',
  OWN = 'own',
  SPECIFIC = 'specific',
}

export class FeedQueryDto {
  @IsEnum(SortOption)
  @IsOptional()
  sort?: SortOption = SortOption.LATEST;

  @IsEnum(FilterType)
  @IsOptional()
  filter?: FilterType = FilterType.ALL;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  specificUserId?: number;
}
