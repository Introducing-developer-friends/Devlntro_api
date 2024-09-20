import { Controller, Post, Put, Delete, Body, Param, UseGuards, Req, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PostService } from './post.service';
import { CreatePostDto, UpdatePostDto } from './dto/post.dto';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { Request } from 'express'; // Express Request 타입 임포트

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
  constructor(private readonly postService: PostService) {}

  @Post()

  @UseInterceptors(
    FileInterceptor('image', {
      storage: diskStorage({
        destination: './uploads',
        filename: (req, file, cb) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
          cb(null, file.fieldname + '-' + uniqueSuffix + extname(file.originalname));
        },
      }),
      fileFilter: (req, file, cb) => {
        if (file.mimetype.match(/\/(jpg|jpeg|png|gif)$/)) {
          cb(null, true);
        } else {
          cb(new Error('지원되지 않는 파일 형식입니다.'), false);
        }
      },
    }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        content: { type: 'string' },
        image: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiOperation({ summary: '게시물 작성' })
  @ApiResponse({ status: 201, description: '게시물이 성공적으로 작성되었습니다.' })
  @ApiResponse({ status: 400, description: '게시물 작성에 실패했습니다. 필수 필드를 확인해주세요.' })
  async createPost(
    @Req() req: CustomRequest,
    @Body() createPostDto: CreatePostDto,
    @UploadedFile() file: Express.Multer.File
  ) {
    const userId = req.user.userId; // JWT에서 사용자 ID 추출
    return this.postService.createPost(userId, createPostDto, file);
  }

  @Put(':postId')
  @UseInterceptors(
    FileInterceptor('image', {
      storage: diskStorage({
        destination: './uploads',
        filename: (req, file, cb) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
          cb(null, file.fieldname + '-' + uniqueSuffix + extname(file.originalname));
        },
      }),
      fileFilter: (req, file, cb) => {
        if (file.mimetype.match(/\/(jpg|jpeg|png|gif)$/)) {
          cb(null, true);
        } else {
          cb(new Error('지원되지 않는 파일 형식입니다.'), false);
        }
      },
    }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        content: { type: 'string' },
        image: { type: 'string', format: 'binary' },
      },
    },
  })
  @ApiOperation({ summary: '게시물 수정' })
  @ApiResponse({ status: 200, description: '게시물이 성공적으로 수정되었습니다.' })
  @ApiResponse({ status: 400, description: '게시물 수정에 실패했습니다. 유효한 데이터를 입력해주세요.' })
  @ApiResponse({ status: 404, description: '게시물을 찾을 수 없습니다.' })
  async updatePost(
    @Req() req: CustomRequest,
    @Param('postId') postId: number,
    @Body() updatePostDto: UpdatePostDto,
    @UploadedFile() file: Express.Multer.File
  ) {
    const userId = req.user.userId; // JWT에서 사용자 ID 추출
    return this.postService.updatePost(userId, postId, updatePostDto, file);
  }

  @Delete(':postId')
  @ApiOperation({ summary: '게시물 삭제' })
  @ApiResponse({ status: 200, description: '게시물이 성공적으로 삭제되었습니다.' })
  @ApiResponse({ status: 404, description: '게시물을 찾을 수 없습니다.' })
  async deletePost(@Req() req: CustomRequest, @Param('postId') postId: number) {
    const userId = req.user.userId; // JWT에서 사용자 ID 추출
    return this.postService.deletePost(userId, postId);
  }

  @Post(':postId/like')
  @ApiOperation({ summary: '게시물 좋아요/취소' })
  @ApiResponse({ status: 200, description: '게시물에 좋아요를 눌렀습니다.' })
  @ApiResponse({ status: 200, description: '게시물 좋아요를 취소했습니다.' })
  @ApiResponse({ status: 404, description: '게시물을 찾을 수 없습니다.' })
  async likePost(@Req() req: CustomRequest, @Param('postId') postId: number) {
    const userId = req.user.userId;
    return this.postService.likePost(userId, postId);
  }
}