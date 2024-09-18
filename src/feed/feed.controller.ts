import { Controller, Get, Query, UseGuards, Req, Param, NotFoundException, BadRequestException } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { FeedService } from './feed.service';
import { FeedQueryDto } from '../dto/feed-query.dto';
import { Request } from 'express';  // Express Request 타입 임포트

interface CustomRequest extends Request {
    user: {
      userId: number;  // userId 타입을 명시적으로 정의
    };
  }

@Controller('posts')
@UseGuards(JwtAuthGuard)  // JWT 인증을 사용하는 Guard
export class FeedController {
  constructor(private readonly feedService: FeedService) {}

  /**
   * 피드 조회
   * @param req - 요청 객체, JWT로부터 유저 정보 추출
   * @param query - 쿼리 파라미터 (정렬 옵션, 필터 옵션 등)
   * @returns 필터링 및 정렬된 피드 목록
   */
  @Get()
  async getFeed(@Req() req: CustomRequest, @Query() query: FeedQueryDto) {
    const userId = req.user.userId;

    // 특정 유저의 게시물을 조회하려면 specificUserId가 필수
    if (query.filter === 'specific' && !query.specificUserId) {
      throw new BadRequestException('specificUserId가 필요합니다.');
    }

    // FeedService를 사용하여 피드 조회
    return this.feedService.getFeed(userId, query.sort, query.filter, query.specificUserId);
  }

  /**
   * 게시물 상세 조회
   * @param req - 요청 객체, JWT로부터 유저 정보 추출
   * @param postId - 조회할 게시물 ID
   * @returns 게시물 상세 정보
   */
  @Get(':postId')
  async getPostDetail(@Req() req, @Param('postId') postId: number) {
    const userId = req.user.userId;

    // postId가 유효하지 않은 경우 처리
    if (!postId) {
      throw new BadRequestException('유효하지 않은 게시물 ID입니다.');
    }

    // FeedService를 사용하여 게시물 상세 정보 조회
    const post = await this.feedService.getPostDetail(userId, postId);
    if (!post) {
      throw new NotFoundException('해당 게시물을 찾을 수 없습니다.');
    }
    return post;
  }
}
