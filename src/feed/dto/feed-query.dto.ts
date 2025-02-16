import { IsEnum, IsOptional, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { FeedQuery } from '../../types/feed.types';
import { FilterType, SortOption } from '../../enums/sort.enum';

export class FeedQueryDto implements Partial<FeedQuery> {
  @ApiProperty({
    enum: SortOption,
    enumName: 'SortOption',
    description:
      '게시물 정렬 옵션 (latest: 최신순, likes: 좋아요순, comments: 댓글순)',
    required: false,
    default: SortOption.LATEST,
    example: SortOption.LATEST,
  })
  @IsEnum(SortOption)
  @IsOptional()
  sort: SortOption = SortOption.LATEST;

  @ApiProperty({
    enum: FilterType,
    enumName: 'FilterType',
    description:
      '게시물 필터링 옵션 (all: 전체, own: 내 게시물, specific: 특정 사용자)',
    required: false,
    default: FilterType.ALL,
    example: FilterType.ALL,
  })
  @IsEnum(FilterType)
  @IsOptional()
  filter: FilterType = FilterType.ALL;

  @ApiProperty({
    type: Number,
    description:
      '특정 사용자의 게시물만 조회할 때 사용하는 사용자 ID (filter가 specific일 때 필수)',
    required: false,
    example: 12345,
  })
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  specificUserId?: number;
}
