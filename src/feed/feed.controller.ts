import { Controller, Get, Query, UseGuards, Req, Param, HttpStatus } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { FeedService } from './feed.service';
import { FeedQueryDto } from '../dto/feed-query.dto';
import { Request } from 'express';  // Express Request 타입 임포트
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery, ApiParam } from '@nestjs/swagger';
import { 
  FeedResponse,
  SortOption,
  FilterType,
  PostDetailResponse 
} from '../types/feed.types';

// JWT로부터 추출된 사용자 정보를 포함하는 요청 인터페이스
interface CustomRequest extends Request {
  user: {
    userId: number;  // userId 타입을 명시적으로 정의
  };
}

@ApiTags('Feed')  // Swagger 태그 추가
@ApiBearerAuth()  // JWT 인증 사용 명시
@Controller('posts')
@UseGuards(JwtAuthGuard)  // JWT 인증을 사용하는 Guard
export class FeedController {
  constructor(private readonly feedService: FeedService) {}

  @ApiOperation({ summary: '피드 조회', description: '메인 페이지 피드, 내 게시물, 특정 유저 게시물 조회' })
  @ApiQuery({ name: 'sort', enum: ['latest', 'likes', 'comments'], description: '정렬 기준 선택', required: false })
  @ApiQuery({ name: 'filter', enum: ['all', 'own', 'specific'], description: '게시물 필터링 옵션' })
  @ApiQuery({ name: 'specificUserId', type: Number, description: '특정 유저 게시물 조회 시 필요한 유저 ID', required: false })
  @ApiResponse({ status: HttpStatus.OK, description: '피드를 성공적으로 조회했습니다.', schema: {
    example: {
      statusCode: HttpStatus.OK,
      message: "피드를 성공적으로 조회했습니다.",
      posts: [
        {
          postId: 123,
          createrId: 456,
          createrName: "홍길동",
          createdAt: "2024-09-18T12:34:56.000Z",
          imageUrl: "https://example.com/image.jpg",
          isOwnPost: true
        },
        {
          postId: 124,
          createrId: 789,
          createrName: "김철수",
          createdAt: "2024-09-18T13:00:00.000Z",
          imageUrl: "https://example.com/image2.jpg",
          isOwnPost: false
        }
      ]
    }
  }})
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: '잘못된 요청입니다. specificUserId가 필요합니다.', schema: {
    example: {
      statusCode: HttpStatus.BAD_REQUEST,
      message: "잘못된 요청입니다. specificUserId가 필요합니다.",
      error: "Bad Request"
    }
  }})
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: '해당 게시물을 찾을 수 없습니다.', schema: {
    example: {
      statusCode: HttpStatus.NOT_FOUND,
      message: "해당 게시물을 찾을 수 없습니다.",
      error: "Not Found"
    }
  }})
  @Get() // 피드 조회 핸들러 메서드
  async getFeed(
    @Req() req: CustomRequest, 
    @Query() query: FeedQueryDto
  ): Promise<FeedResponse> { 
    const { userId } = req.user; // JWT에서 추출된 사용자 ID 가져오기
    const { sort = SortOption.LATEST, filter = FilterType.ALL, specificUserId } = query;
    
    // FeedService를 통해 피드 조회
    const posts = await this.feedService.getFeed(userId, sort, filter, specificUserId);
    
    // 응답 데이터 반환
    return {
      statusCode: HttpStatus.OK,
      message: '피드를 성공적으로 조회했습니다.',
      posts
    };
  }

  @ApiOperation({ summary: '게시물 상세 조회', description: '게시물 ID를 통해 게시물의 상세 정보를 조회' })
  @ApiParam({ name: 'postId', type: Number, description: '조회할 게시물의 ID' })
  @ApiResponse({ status: HttpStatus.OK, description: '게시물을 성공적으로 조회했습니다.', schema: {
    example: {
      statusCode: HttpStatus.OK,
      message: "게시물을 성공적으로 조회했습니다.",
      postId: 123,
      createrId: 456,
      createrName: "홍길동",
      createdAt: "2024-09-18T12:34:56.000Z",
      imageUrl: "https://example.com/image.jpg",
      content: "이 게시물의 내용입니다.",
      likesCount: 42,
      commentsCount: 10,
      isOwnPost: true,
      comments: [
        {
          commentId: 1,
          authorName: "김철수",
          content: "멋진 게시물이네요!",
          createdAt: "2024-09-18T12:45:00.000Z",
          likeCount: 5
        },
        {
          commentId: 2,
          authorName: "이영희",
          content: "좋은 글 감사합니다.",
          createdAt: "2024-09-18T13:00:00.000Z",
          likeCount: 2
        }
      ],
      likes: [
        {
          userId: 789,
          userName: "김철수"
        },
        {
          userId: 890,
          userName: "이영희"
        }
      ]
    }
  }})
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: '유효하지 않은 게시물 ID입니다.', schema: {
    example: {
      statusCode: HttpStatus.BAD_REQUEST,
      message: "유효하지 않은 게시물 ID입니다.",
      error: "Bad Request"
    }
  }})
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: '해당 게시물을 찾을 수 없습니다.', schema: {
    example: {
      statusCode: HttpStatus.NOT_FOUND,
      message: "해당 게시물을 찾을 수 없습니다.",
      error: "Not Found"
    }
  }})
  @Get(':postId') // 게시물 상세 조회 핸들러 메서드
  async getPostDetail(
    @Req() req: CustomRequest,
    @Param('postId') postId: number
  ): Promise<PostDetailResponse> {
    const { userId } = req.user;
    const post = await this.feedService.getPostDetail(userId, postId);
    
    // 응답 데이터 반환
    return {
      statusCode: HttpStatus.OK,
      message: '게시물을 성공적으로 조회했습니다.',
      ...post // 게시물 상세 정보 반환
    };
  }
}
