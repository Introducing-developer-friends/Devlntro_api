import { Controller, Post, Put, Delete, Body, Param, UseGuards, Req, HttpStatus, BadRequestException,
  NotFoundException } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CommentService } from './comment.service';
import { CreateCommentDto, UpdateCommentDto } from './dto/comment.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { Request } from 'express'; // Express Request 타입 임포트
import { CommentResponse } from '../types/comment.types';

// JWT로부터 추출된 사용자 정보를 포함하는 요청 인터페이스
interface CustomRequest extends Request {
  user: {
    userId: number;  // userId 타입을 명시적으로 정의
  };
}

@ApiTags('Comments') // Swagger에서 이 컨트롤러를 'Comments' 태그로 그룹화
@ApiBearerAuth()
@Controller('posts/:postId/comments')
@UseGuards(JwtAuthGuard)
export class CommentController {
  constructor(private readonly commentService: CommentService) {}

  // 댓글 작성 엔드포인트
  @Post()
  @ApiOperation({ summary: '댓글 작성', description: '게시물에 새 댓글을 작성합니다.' })
  @ApiParam({ name: 'postId', description: '댓글을 작성할 게시물의 ID' })
  @ApiResponse({ status: HttpStatus.CREATED, description: '댓글이 성공적으로 작성되었습니다.' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: '댓글 작성에 실패했습니다. 내용을 입력해주세요.' })
  async createComment(
    @Req() req: CustomRequest,
    @Param('postId') postId: number,
    @Body() createCommentDto: CreateCommentDto
  ): Promise<CommentResponse> {
    const result = await this.commentService.createComment(
      req.user.userId,
      postId,
      createCommentDto
    );
    
    return {
      statusCode: HttpStatus.CREATED,
      message: '댓글이 성공적으로 작성되었습니다.',
      commentId: result.commentId
    };
  }

  // 댓글 수정 엔드포인트
  @Put(':commentId')
  @ApiOperation({ summary: '댓글 수정', description: '기존 댓글을 수정합니다.' })
  @ApiParam({ name: 'postId', description: '수정할 댓글이 속한 게시물의 ID' })
  @ApiParam({ name: 'commentId', description: '수정할 댓글의 ID' })
  @ApiResponse({ status: HttpStatus.OK, description: '댓글이 성공적으로 수정되었습니다.' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: '댓글 수정에 실패했습니다. 유효한 내용을 입력해주세요.' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: '댓글을 찾을 수 없습니다.' })
  async updateComment(
    @Req() req: CustomRequest,
    @Param('postId') postId: number,
    @Param('commentId') commentId: number,
    @Body() updateCommentDto: UpdateCommentDto
  ): Promise<CommentResponse> {
    await this.commentService.updateComment(
      req.user.userId,
      postId,
      commentId,
      updateCommentDto
    );

    return {
      statusCode: HttpStatus.OK,
      message: '댓글이 성공적으로 수정되었습니다.'
    };
  }

  // 댓글 삭제 엔드포인트
  @Delete(':commentId')
  @ApiOperation({ summary: '댓글 삭제', description: '댓글을 삭제합니다.' })
  @ApiParam({ name: 'postId', description: '삭제할 댓글이 속한 게시물의 ID' })
  @ApiParam({ name: 'commentId', description: '삭제할 댓글의 ID' })
  @ApiResponse({ status: HttpStatus.OK, description: '댓글이 성공적으로 삭제되었습니다.' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: '댓글을 찾을 수 없습니다.' })
  async deleteComment(
    @Req() req: CustomRequest,
    @Param('postId') postId: number,
    @Param('commentId') commentId: number
  ): Promise<CommentResponse> {
    await this.commentService.deleteComment(
      req.user.userId,
      postId,
      commentId
    );

    return {
      statusCode: HttpStatus.OK,
      message: '댓글이 성공적으로 삭제되었습니다.'
    };
  }

  // 댓글 좋아요 엔드포인트
  @Post(':commentId/like')
  @ApiOperation({ summary: '댓글 좋아요', description: '댓글에 좋아요를 누르거나 취소합니다.' })
  @ApiParam({ name: 'postId', description: '좋아요를 누를 댓글이 속한 게시물의 ID' })
  @ApiParam({ name: 'commentId', description: '좋아요를 누를 댓글의 ID' })
  @ApiResponse({ status: HttpStatus.OK, description: '댓글에 좋아요를 눌렀습니다.' })
  @ApiResponse({ status: HttpStatus.OK, description: '댓글 좋아요를 취소했습니다.' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: '댓글을 찾을 수 없습니다.' })
  async likeComment(
    @Req() req: CustomRequest,
    @Param('postId') postId: number,
    @Param('commentId') commentId: number
  ): Promise<CommentResponse> {
    const result = await this.commentService.likeComment(
      req.user.userId,
      postId,
      commentId
    );

    return {
      statusCode: HttpStatus.OK,
      message: result.isLiked ? '댓글에 좋아요를 눌렀습니다.' : '댓글 좋아요를 취소했습니다.',
      likeCount: result.likeCount
    };
  }
}