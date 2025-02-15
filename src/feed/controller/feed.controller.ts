import {
  Controller,
  Get,
  Query,
  UseGuards,
  Req,
  Param,
  HttpStatus,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../jwt/jwt-auth.guard';
import { FeedService } from '../service/feed.service';
import { FeedQueryDto } from '../../dto/feed-query.dto';

import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
  ApiOkResponse,
  ApiNotFoundResponse,
  ApiBadRequestResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { FeedResponse, PostDetailResponse } from '../../types/feed.types';
import {
  BadRequestResponse,
  NotFoundResponse,
  UnauthorizedResponse,
} from '../../types/response.type';
import { ErrorMessageType } from '../../enums/error.message.enum';
import { CustomRequest } from 'src/types/request.type';
import { FilterType, SortOption } from '../../enums/sort.enum';

@ApiTags('Feed')
@ApiBearerAuth()
@Controller('posts')
@UseGuards(JwtAuthGuard)
export class FeedController {
  constructor(private readonly feedService: FeedService) {}

  @ApiOperation({
    summary: '피드 조회',
  })
  @ApiQuery({
    name: 'sort',
    enum: Object.values(SortOption),
    description: '정렬 기준 선택',
    required: false,
    example: SortOption.LATEST,
  })
  @ApiQuery({
    name: 'filter',
    enum: Object.values(FilterType),
    description: '게시물 필터링 옵션',
    required: false,
    example: FilterType.ALL,
  })
  @ApiQuery({
    name: 'specificUserId',
    type: Number,
    description: '특정 유저 게시물 조회 시 필요한 유저 ID',
    required: false,
  })
  @ApiOkResponse({
    type: FeedResponse,
    description: '피드를 성공적으로 조회했습니다.',
  })
  @ApiBadRequestResponse({
    type: BadRequestResponse,
    description: ErrorMessageType.BAD_REQUEST,
  })
  @ApiUnauthorizedResponse({
    type: UnauthorizedResponse,
    description: ErrorMessageType.INVALID_AUTH,
  })
  @ApiNotFoundResponse({
    type: NotFoundResponse,
    description: ErrorMessageType.NOT_FOUND_FEED,
  })
  @Get()
  async getFeed(
    @Req() req: CustomRequest,
    @Query() query: FeedQueryDto,
  ): Promise<FeedResponse> {
    const { userId } = req.user;
    const {
      sort = SortOption.LATEST,
      filter = FilterType.ALL,
      specificUserId,
    } = query;

    const posts = await this.feedService.getFeed(
      userId,
      sort,
      filter,
      specificUserId,
    );

    return {
      statusCode: HttpStatus.OK,
      message: '피드를 성공적으로 조회했습니다.',
      posts,
    };
  }

  @Get(':postId')
  @ApiOperation({
    summary: '게시물 상세 조회',
  })
  @ApiOkResponse({
    type: PostDetailResponse,
    description: '게시물을 성공적으로 조회했습니다.',
  })
  @ApiBadRequestResponse({
    type: BadRequestResponse,
    description: ErrorMessageType.BAD_REQUEST,
  })
  @ApiUnauthorizedResponse({
    type: UnauthorizedResponse,
    description: ErrorMessageType.INVALID_AUTH,
  })
  @ApiNotFoundResponse({
    type: NotFoundResponse,
    description: ErrorMessageType.NOT_FOUND_FEED,
  })
  @Get(':postId')
  async getPostDetail(
    @Req() req: CustomRequest,
    @Param('postId') postId: number,
  ): Promise<PostDetailResponse> {
    const { userId } = req.user;
    const post = await this.feedService.getPostDetail(userId, postId);

    return {
      statusCode: HttpStatus.OK,
      message: '게시물을 성공적으로 조회했습니다.',
      ...post,
    };
  }
}
