import { Controller, Post, Put, Delete, Body, Param, UseGuards, Req, UseInterceptors, UploadedFile, HttpStatus } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PostService } from './post.service';
import { CreatePostDto, UpdatePostDto } from './dto/post.dto';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, ApiConsumes } from '@nestjs/swagger';
import { Request } from 'express';
import { S3Service } from '../s3/s3.service';
import { 
  PostCreateResponse,
  PostUpdateResponse,
  PostDeleteResponse,
  PostLikeResponse
} from '../types/post.types';

// JWT로부터 추출된 사용자 정보를 포함하는 요청 인터페이스
interface CustomRequest extends Request {
  user: {
    userId: number;  // userId 타입을 명시적으로 정의
  };
}

@ApiTags('posts') // Swagger에서 그룹화
@ApiBearerAuth() // JWT 토큰을 사용함을 명시
@Controller('posts')
@UseGuards(JwtAuthGuard) // JWT 인증 가드 적용
export class PostController {
  constructor(
    private readonly postService: PostService,
    private readonly s3Service: S3Service
  ) {}

  // 게시물 작성 엔드포인트 (POST 요청)
  @Post()
  @UseInterceptors(FileInterceptor('image')) // 파일 업로드 인터셉터 적용
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: '게시물 작성' })
  @ApiResponse({ status: HttpStatus.CREATED, description: '게시물이 성공적으로 작성되었습니다.' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: '게시물 작성에 실패했습니다. 필수 필드를 확인해주세요.' })
  async createPost(
    @Req() req: CustomRequest,
    @Body() createPostDto: CreatePostDto,
    @UploadedFile() file: Express.Multer.File
  ): Promise<PostCreateResponse> {

    
    let imageUrl = null;

    // 파일이 존재할 경우 이미지 업로드 처리
    if (file && file.size > 0) {
      const sanitizedFileName = file.originalname
        .replace(/\s+/g, '-')
        .replace(/[^\w.-]/g, '');
      const key = `images/${Date.now()}-${sanitizedFileName}`;
      imageUrl = await this.s3Service.uploadFile(file, key);
    }

    // 게시물 생성 서비스 호출
    const post = await this.postService.createPost(req.user.userId, {
      content: createPostDto.content,
      imageUrl
    });

    // 성공 응답 반환
    return {
      statusCode: HttpStatus.CREATED,
      message: '게시물이 성공적으로 작성되었습니다.',
      postId: post.postId,
      imageUrl: post.imageUrl
    };
  }

  // 게시물 수정 엔드포인트 (PUT 요청)
  @Put(':postId')
  @UseInterceptors(FileInterceptor('image'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: '게시물 수정' })
  @ApiResponse({ status: HttpStatus.OK, description: '게시물이 성공적으로 수정되었습니다.' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: '게시물 수정에 실패했습니다. 유효한 데이터를 입력해주세요.' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: '게시물을 찾을 수 없습니다.' })
  async updatePost(
    @Req() req: CustomRequest,
    @Param('postId') postId: number,
    @Body() updatePostDto: UpdatePostDto,
    @UploadedFile() file: Express.Multer.File
  ): Promise<PostUpdateResponse> {
    let imageUrl = null;

    // 파일이 존재할 경우 이미지 업로드 처리
    if (file) {
      const sanitizedFileName = file.originalname
        .replace(/\s+/g, '-')
        .replace(/[^\w.-]/g, '');
      const key = `images/${Date.now()}-${sanitizedFileName}`;
      imageUrl = await this.s3Service.uploadFile(file, key);
    }

    await this.postService.updatePost(req.user.userId, postId, {
      content: updatePostDto.content,
      imageUrl
    });

    return {
      statusCode: HttpStatus.OK,
      message: '게시물이 성공적으로 수정되었습니다.'
    };
  }

  // 게시물 좋아요/취소 엔드포인트 (POST 요청)
  @Delete(':postId')
  @ApiOperation({ summary: '게시물 삭제' })
  @ApiResponse({ status: HttpStatus.OK, description: '게시물이 성공적으로 삭제되었습니다.' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: '게시물을 찾을 수 없습니다.' })
  async deletePost(
    @Req() req: CustomRequest,
    @Param('postId') postId: number
  ): Promise<PostDeleteResponse> {

    await this.postService.deletePost(req.user.userId, postId);

    // 성공 응답 반환
    return {
      statusCode: HttpStatus.OK,
      message: '게시물이 성공적으로 삭제되었습니다.'
    };
  }

  @Post(':postId/like')
  @ApiOperation({ summary: '게시물 좋아요/취소' })
  @ApiResponse({ status: HttpStatus.OK, description: '게시물에 좋아요를 눌렀습니다.' })
  @ApiResponse({ status: HttpStatus.OK, description: '게시물 좋아요를 취소했습니다.' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: '게시물을 찾을 수 없습니다.' })
  async likePost(
    @Req() req: CustomRequest,
    @Param('postId') postId: number
  ): Promise<PostLikeResponse> {

    const result = await this.postService.likePost(req.user.userId, postId);

    return {
      statusCode: HttpStatus.OK,
      message: result.isLiked ? '게시물에 좋아요를 눌렀습니다.' : '게시물 좋아요를 취소했습니다.',
      likeCount: result.likeCount
    };
  }
}