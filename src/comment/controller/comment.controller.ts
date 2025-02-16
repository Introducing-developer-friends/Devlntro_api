import {
  Controller,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Req,
  HttpStatus,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../jwt/jwt-auth.guard';
import { CommentService } from '../service/comment.service';
import { CreateCommentDto } from '../dto/create.comment.dto';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiBadRequestResponse,
  ApiUnauthorizedResponse,
  ApiOkResponse,
  ApiNotFoundResponse,
} from '@nestjs/swagger';

import {
  CommentCreateResponse,
  CommentLikeResponse,
} from '../../types/comment.types';
import {
  BadRequestResponse,
  BaseResponse,
  NotFoundResponse,
  UnauthorizedResponse,
} from '../../types/response.type';
import { ErrorMessageType } from '../../enums/error.message.enum';
import { CustomRequest } from '../../types/request.type';
import { UpdateCommentDto } from '../dto/update.comment.dto';

@ApiTags('Comments')
@ApiBearerAuth()
@Controller('posts/:postId/comments')
@UseGuards(JwtAuthGuard)
export class CommentController {
  constructor(private readonly commentService: CommentService) {}

  @Post()
  @ApiOperation({ summary: '댓글 작성' })
  @ApiCreatedResponse({
    type: CommentCreateResponse,
    description: '댓글이 성공적으로 작성되었습니다.',
  })
  @ApiBadRequestResponse({
    type: BadRequestResponse,
    description: ErrorMessageType.BAD_REQUEST,
  })
  @ApiUnauthorizedResponse({
    type: UnauthorizedResponse,
    description: ErrorMessageType.INVALID_AUTH,
  })
  async createComment(
    @Req() req: CustomRequest,
    @Param('postId') postId: number,
    @Body() createCommentDto: CreateCommentDto,
  ): Promise<CommentCreateResponse> {
    const result = await this.commentService.createComment(
      req.user.userId,
      postId,
      createCommentDto,
    );

    return {
      statusCode: HttpStatus.CREATED,
      message: '댓글이 성공적으로 작성되었습니다.',
      commentId: result.commentId,
    };
  }

  @Put(':commentId')
  @ApiOperation({
    summary: '댓글 수정',
  })
  @ApiOkResponse({
    type: BaseResponse,
    description: '댓글이 성공적으로 수정되었습니다.',
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
  async updateComment(
    @Req() req: CustomRequest,
    @Param('postId') postId: number,
    @Param('commentId') commentId: number,
    @Body() updateCommentDto: UpdateCommentDto,
  ): Promise<BaseResponse> {
    await this.commentService.updateComment(
      req.user.userId,
      postId,
      commentId,
      updateCommentDto,
    );

    return {
      statusCode: HttpStatus.OK,
      message: '댓글이 성공적으로 수정되었습니다.',
    };
  }

  @Delete(':commentId')
  @ApiOperation({
    summary: '댓글 삭제',
  })
  @ApiOkResponse({
    type: BaseResponse,
    description: '댓글이 성공적으로 삭제되었습니다.',
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
  async deleteComment(
    @Req() req: CustomRequest,
    @Param('postId') postId: number,
    @Param('commentId') commentId: number,
  ): Promise<BaseResponse> {
    await this.commentService.deleteComment(req.user.userId, postId, commentId);

    return {
      statusCode: HttpStatus.OK,
      message: '댓글이 성공적으로 삭제되었습니다.',
    };
  }

  @Post(':commentId/like')
  @ApiOperation({
    summary: '댓글 좋아요',
  })
  @ApiOkResponse({
    type: CommentLikeResponse,
    description: '댓글 좋아요 상태가 변경되었습니다.',
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
  async likeComment(
    @Req() req: CustomRequest,
    @Param('postId') postId: number,
    @Param('commentId') commentId: number,
  ): Promise<CommentLikeResponse> {
    const result = await this.commentService.likeComment(
      req.user.userId,
      postId,
      commentId,
    );

    return {
      statusCode: HttpStatus.OK,
      message: result.isLiked
        ? '댓글에 좋아요를 눌렀습니다.'
        : '댓글 좋아요를 취소했습니다.',
      likeCount: result.likeCount,
    };
  }
}
