import { IsEnum, IsOptional, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

// 게시물을 정렬할 수 있는 옵션을 정의한 열거형
export enum SortOption {
  LATEST = 'latest', // 최신 순으로 정렬
  LIKES = 'likes',
  COMMENTS = 'comments',
}

// 게시물을 필터링할 수 있는 유형을 정의한 열거형
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
  @Type(() => Number) // 문자열로 전달된 값도 숫자로 변환
  specificUserId?: number;
}
