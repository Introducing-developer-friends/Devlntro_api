import {
  Controller,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Req,
  UseInterceptors,
  UploadedFile,
  HttpStatus,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PostService } from './post.service';
import { CreatePostDto, UpdatePostDto } from './dto/post.dto';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiConsumes,
} from '@nestjs/swagger';
import { Request } from 'express';
import { S3Service } from '../s3/s3.service';
import {
  PostCreateResponse,
  PostUpdateResponse,
  PostDeleteResponse,
  PostLikeResponse,
} from '../types/post.types';

interface CustomRequest extends Request {
  user: {
    userId: number;
  };
}

@ApiTags('posts')
@ApiBearerAuth() //
@Controller('posts')
@UseGuards(JwtAuthGuard)
export class PostController {
  constructor(
    private readonly postService: PostService,
    private readonly s3Service: S3Service,
  ) {}

  @Post()
  @UseInterceptors(FileInterceptor('image'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: '게시물 작성' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: '게시물이 성공적으로 작성되었습니다.',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: '게시물 작성에 실패했습니다. 필수 필드를 확인해주세요.',
  })
  async createPost(
    @Req() req: CustomRequest,
    @Body() createPostDto: CreatePostDto,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<PostCreateResponse> {
    let imageUrl = null;

    if (file && file.size > 0) {
      const sanitizedFileName = file.originalname
        .replace(/\s+/g, '-')
        .replace(/[^\w.-]/g, '');
      const key = `images/${Date.now()}-${sanitizedFileName}`;
      imageUrl = await this.s3Service.uploadFile(file, key);
    }

    const post = await this.postService.createPost(req.user.userId, {
      content: createPostDto.content,
      imageUrl,
    });

    return {
      statusCode: HttpStatus.CREATED,
      message: '게시물이 성공적으로 작성되었습니다.',
      postId: post.postId,
      imageUrl: post.imageUrl,
    };
  }

  @Put(':postId')
  @UseInterceptors(FileInterceptor('image'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: '게시물 수정' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '게시물이 성공적으로 수정되었습니다.',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: '게시물 수정에 실패했습니다. 유효한 데이터를 입력해주세요.',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: '게시물을 찾을 수 없습니다.',
  })
  async updatePost(
    @Req() req: CustomRequest,
    @Param('postId') postId: number,
    @Body() updatePostDto: UpdatePostDto,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<PostUpdateResponse> {
    let imageUrl = null;

    if (file) {
      const sanitizedFileName = file.originalname
        .replace(/\s+/g, '-')
        .replace(/[^\w.-]/g, '');
      const key = `images/${Date.now()}-${sanitizedFileName}`;
      imageUrl = await this.s3Service.uploadFile(file, key);
    }

    await this.postService.updatePost(req.user.userId, postId, {
      content: updatePostDto.content,
      imageUrl,
    });

    return {
      statusCode: HttpStatus.OK,
      message: '게시물이 성공적으로 수정되었습니다.',
    };
  }

  @Delete(':postId')
  @ApiOperation({ summary: '게시물 삭제' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '게시물이 성공적으로 삭제되었습니다.',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: '게시물을 찾을 수 없습니다.',
  })
  async deletePost(
    @Req() req: CustomRequest,
    @Param('postId') postId: number,
  ): Promise<PostDeleteResponse> {
    await this.postService.deletePost(req.user.userId, postId);

    return {
      statusCode: HttpStatus.OK,
      message: '게시물이 성공적으로 삭제되었습니다.',
    };
  }

  @Post(':postId/like')
  @ApiOperation({ summary: '게시물 좋아요/취소' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '게시물에 좋아요를 눌렀습니다.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '게시물 좋아요를 취소했습니다.',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: '게시물을 찾을 수 없습니다.',
  })
  async likePost(
    @Req() req: CustomRequest,
    @Param('postId') postId: number,
  ): Promise<PostLikeResponse> {
    const result = await this.postService.likePost(req.user.userId, postId);

    return {
      statusCode: HttpStatus.OK,
      message: result.isLiked
        ? '게시물에 좋아요를 눌렀습니다.'
        : '게시물 좋아요를 취소했습니다.',
      likeCount: result.likeCount,
    };
  }
}
