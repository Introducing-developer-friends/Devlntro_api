import { Test, TestingModule } from '@nestjs/testing';
import { CommentController } from './comment.controller';
import { CommentService } from './comment.service';
import { CreateCommentDto, UpdateCommentDto } from './dto/comment.dto';
import {
  NotFoundException,
  BadRequestException,
  HttpStatus,
} from '@nestjs/common';
import { CommentResponse } from '../types/comment.types';

describe('CommentController', () => {
  let controller: CommentController;
  let mockCommentService: Partial<CommentService>;

  beforeEach(async () => {
    mockCommentService = {
      createComment: jest.fn().mockImplementation(() =>
        Promise.resolve({
          commentId: 1,
        }),
      ),

      updateComment: jest.fn().mockImplementation(() => Promise.resolve()),

      deleteComment: jest.fn().mockImplementation(() => Promise.resolve()),

      likeComment: jest.fn().mockImplementation(() =>
        Promise.resolve({
          isLiked: true,
          likeCount: 1,
        }),
      ),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [CommentController],
      providers: [{ provide: CommentService, useValue: mockCommentService }],
    }).compile();

    controller = module.get<CommentController>(CommentController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('createComment', () => {
    it('should create a comment successfully', async () => {
      const createCommentDto: CreateCommentDto = { content: 'Test comment' };
      const req = { user: { userId: 1 } } as any;

      const expectedResponse: CommentResponse = {
        statusCode: HttpStatus.CREATED,
        message: '댓글이 성공적으로 작성되었습니다.',
        commentId: 1,
      };

      const result = await controller.createComment(req, 1, createCommentDto);
      expect(result).toEqual(expectedResponse);

      expect(mockCommentService.createComment).toHaveBeenCalledWith(
        req.user.userId,
        1,
        createCommentDto,
      );
    });

    it('should throw BadRequestException when content is empty', async () => {
      const createCommentDto: CreateCommentDto = { content: '' };
      const req = { user: { userId: 1 } } as any;

      jest.spyOn(mockCommentService, 'createComment').mockImplementation(() => {
        throw new BadRequestException(
          '댓글 작성에 실패했습니다. 내용을 입력해주세요.',
        );
      });

      await expect(
        controller.createComment(req, 1, createCommentDto),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('updateComment', () => {
    it('should update a comment successfully', async () => {
      const updateCommentDto: UpdateCommentDto = { content: 'Updated comment' };
      const req = { user: { userId: 1 } } as any;

      const expectedResponse: CommentResponse = {
        statusCode: HttpStatus.OK,
        message: '댓글이 성공적으로 수정되었습니다.',
      };

      const result = await controller.updateComment(
        req,
        1,
        1,
        updateCommentDto,
      );
      expect(result).toEqual(expectedResponse);

      expect(mockCommentService.updateComment).toHaveBeenCalledWith(
        req.user.userId,
        1,
        1,
        updateCommentDto,
      );
    });

    it('should throw NotFoundException when comment is not found', async () => {
      const updateCommentDto: UpdateCommentDto = { content: 'Updated comment' };
      const req = { user: { userId: 1 } } as any;

      jest.spyOn(mockCommentService, 'updateComment').mockImplementation(() => {
        throw new NotFoundException('댓글을 찾을 수 없습니다.');
      });

      await expect(
        controller.updateComment(req, 1, 999, updateCommentDto),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('deleteComment', () => {
    it('should delete a comment successfully', async () => {
      const req = { user: { userId: 1 } } as any;

      const expectedResponse: CommentResponse = {
        statusCode: HttpStatus.OK,
        message: '댓글이 성공적으로 삭제되었습니다.',
      };

      const result = await controller.deleteComment(req, 1, 1);

      expect(result).toEqual(expectedResponse);
      expect(mockCommentService.deleteComment).toHaveBeenCalledWith(
        req.user.userId,
        1,
        1,
      );
    });

    it('should throw NotFoundException when comment is not found', async () => {
      const req = { user: { userId: 1 } } as any;

      jest.spyOn(mockCommentService, 'deleteComment').mockImplementation(() => {
        throw new NotFoundException('댓글을 찾을 수 없습니다.');
      });

      await expect(controller.deleteComment(req, 1, 999)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('likeComment', () => {
    it('should like a comment successfully', async () => {
      const req = { user: { userId: 1 } } as any;

      jest.spyOn(mockCommentService, 'likeComment').mockResolvedValue({
        isLiked: true,
        likeCount: 1,
      });

      const expectedResponse: CommentResponse = {
        statusCode: HttpStatus.OK,
        message: '댓글에 좋아요를 눌렀습니다.',
        likeCount: 1,
      };

      const result = await controller.likeComment(req, 1, 1);

      expect(result).toEqual(expectedResponse);

      expect(mockCommentService.likeComment).toHaveBeenCalledWith(
        req.user.userId,
        1,
        1,
      );
    });

    it('should unlike a comment successfully', async () => {
      const req = { user: { userId: 1 } } as any;

      jest.spyOn(mockCommentService, 'likeComment').mockResolvedValue({
        isLiked: false,
        likeCount: 0,
      });

      const expectedResponse: CommentResponse = {
        statusCode: HttpStatus.OK,
        message: '댓글 좋아요를 취소했습니다.',
        likeCount: 0,
      };

      const result = await controller.likeComment(req, 1, 1);

      expect(result).toEqual(expectedResponse);
    });

    it('should throw NotFoundException when comment is not found', async () => {
      const req = { user: { userId: 1 } } as any;

      jest.spyOn(mockCommentService, 'likeComment').mockImplementation(() => {
        throw new NotFoundException('댓글을 찾을 수 없습니다.');
      });

      await expect(controller.likeComment(req, 1, 999)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
