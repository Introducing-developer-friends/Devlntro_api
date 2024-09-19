import { Controller, Post, Put, Delete, Body, Param, UseGuards, Req } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CommentService } from './comment.service';
import { CreateCommentDto, UpdateCommentDto } from './dto/comment.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';

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
  @ApiResponse({ status: 201, description: '댓글이 성공적으로 작성되었습니다.' })
  @ApiResponse({ status: 400, description: '댓글 작성에 실패했습니다. 내용을 입력해주세요.' })
  async createComment(
    @Req() req,
    @Param('postId') postId: number,
    @Body() createCommentDto: CreateCommentDto
  ) {
    const userId = req.user.userId; // JWT에서 사용자 ID 추출
    return this.commentService.createComment(userId, postId, createCommentDto);
  }

  // 댓글 수정 엔드포인트
  @Put(':commentId')
  @ApiOperation({ summary: '댓글 수정', description: '기존 댓글을 수정합니다.' })
  @ApiParam({ name: 'postId', description: '수정할 댓글이 속한 게시물의 ID' })
  @ApiParam({ name: 'commentId', description: '수정할 댓글의 ID' })
  @ApiResponse({ status: 200, description: '댓글이 성공적으로 수정되었습니다.' })
  @ApiResponse({ status: 400, description: '댓글 수정에 실패했습니다. 유효한 내용을 입력해주세요.' })
  @ApiResponse({ status: 404, description: '댓글을 찾을 수 없습니다.' })
  async updateComment(
    @Req() req,
    @Param('postId') postId: number,
    @Param('commentId') commentId: number,
    @Body() updateCommentDto: UpdateCommentDto
  ) {
    const userId = req.user.userId;
    return this.commentService.updateComment(userId, postId, commentId, updateCommentDto);
  }

  // 댓글 삭제 엔드포인트
  @Delete(':commentId')
  @ApiOperation({ summary: '댓글 삭제', description: '댓글을 삭제합니다.' })
  @ApiParam({ name: 'postId', description: '삭제할 댓글이 속한 게시물의 ID' })
  @ApiParam({ name: 'commentId', description: '삭제할 댓글의 ID' })
  @ApiResponse({ status: 200, description: '댓글이 성공적으로 삭제되었습니다.' })
  @ApiResponse({ status: 404, description: '댓글을 찾을 수 없습니다.' })
  async deleteComment(
    @Req() req,
    @Param('postId') postId: number,
    @Param('commentId') commentId: number
  ) {
    const userId = req.user.userId;
    return this.commentService.deleteComment(userId, postId, commentId);
  }

  // 댓글 좋아요 엔드포인트
  @Post(':commentId/like')
  @ApiOperation({ summary: '댓글 좋아요', description: '댓글에 좋아요를 누르거나 취소합니다.' })
  @ApiParam({ name: 'postId', description: '좋아요를 누를 댓글이 속한 게시물의 ID' })
  @ApiParam({ name: 'commentId', description: '좋아요를 누를 댓글의 ID' })
  @ApiResponse({ status: 200, description: '댓글에 좋아요를 눌렀습니다.' })
  @ApiResponse({ status: 200, description: '댓글 좋아요를 취소했습니다.' })
  @ApiResponse({ status: 404, description: '댓글을 찾을 수 없습니다.' })
  async likeComment(
    @Req() req,
    @Param('postId') postId: number,
    @Param('commentId') commentId: number
  ) {
    const userId = req.user.userId;
    return this.commentService.likeComment(userId, postId, commentId);
  }
}