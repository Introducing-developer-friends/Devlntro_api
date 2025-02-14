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
import { JwtAuthGuard } from '../../jwt/jwt-auth.guard';
import { PostService } from '../service/post.service';
import { CreatePostDto } from '../dto/create.post.dto';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
  ApiConsumes,
  ApiBadRequestResponse,
  ApiUnauthorizedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
} from '@nestjs/swagger';

import { S3Service } from '../../s3/service/s3.service';
import { PostCreateResponse, PostLikeResponse } from '../../types/post.types';
import {
  BadRequestResponse,
  BaseResponse,
  NotFoundResponse,
  UnauthorizedResponse,
} from '../../types/response.type';
import { ErrorMessageType } from '../../enums/error.message.enum';
import { UpdatePostDto } from '../dto/update.post.dto';
import { CustomRequest } from '../../types/request.type';

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
  @ApiOkResponse({
    type: PostCreateResponse,
    description: '게시물이 성공적으로 작성되었습니다.',
  })
  @ApiBadRequestResponse({
    type: BadRequestResponse,
    description: ErrorMessageType.BAD_REQUEST,
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
  @ApiOkResponse({
    type: BaseResponse,
    description: '게시물이 성공적으로 수정되었습니다.',
  })
  @ApiBadRequestResponse({
    type: BaseResponse,
    description: ErrorMessageType.BAD_REQUEST,
  })
  @ApiUnauthorizedResponse({
    type: UnauthorizedResponse,
    description: ErrorMessageType.INVALID_AUTH,
  })
  @ApiNotFoundResponse({
    type: NotFoundResponse,
    description: ErrorMessageType.NOT_FOUND_POST,
  })
  async updatePost(
    @Req() req: CustomRequest,
    @Param('postId') postId: number,
    @Body() updatePostDto: UpdatePostDto,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<BaseResponse> {
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
  @ApiOkResponse({
    type: BaseResponse,
    description: '게시물이 성공적으로 삭제되었습니다.',
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
    description: ErrorMessageType.NOT_FOUND_COMMENT,
  })
  async deletePost(
    @Req() req: CustomRequest,
    @Param('postId') postId: number,
  ): Promise<BaseResponse> {
    await this.postService.deletePost(req.user.userId, postId);

    return {
      statusCode: HttpStatus.OK,
      message: '게시물이 성공적으로 삭제되었습니다.',
    };
  }

  @Post(':postId/like')
  @ApiOperation({ summary: '게시물 좋아요/취소' })
  @ApiOkResponse({
    type: PostLikeResponse,
    description: '게시물에 좋아요를 눌렀습니다.',
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
    description: ErrorMessageType.NOT_FOUND_POST,
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
