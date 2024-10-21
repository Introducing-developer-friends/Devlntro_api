import { Test, TestingModule } from '@nestjs/testing';
import { CommentController } from './comment.controller';
import { CommentService } from './comment.service';
import { CreateCommentDto, UpdateCommentDto } from './dto/comment.dto';
import { NotFoundException, BadRequestException } from '@nestjs/common';

describe('CommentController', () => {
  let controller: CommentController; // CommentController 인스턴스
  let mockCommentService: Partial<CommentService>; // CommentService의 일부만 모킹

  // 각 테스트 전에 CommentService와 CommentController 설정
  beforeEach(async () => {
    mockCommentService = {

      // createComment 메서드 모킹 (성공 시 가짜 응답 반환)
      createComment: jest.fn().mockImplementation(() => Promise.resolve({
        statusCode: 201,
        message: '댓글이 성공적으로 작성되었습니다.',
        commentId: 1,
      })),

      // updateComment 메서드 모킹 (성공 시 가짜 응답 반환)
      updateComment: jest.fn().mockImplementation(() => Promise.resolve({
        statusCode: 200,
        message: '댓글이 성공적으로 수정되었습니다.',
      })),

      // deleteComment 메서드 모킹 (성공 시 가짜 응답 반환)
      deleteComment: jest.fn().mockImplementation(() => Promise.resolve({
        statusCode: 200,
        message: '댓글이 성공적으로 삭제되었습니다.',
      })),

      // likeComment 메서드 모킹 (성공 시 가짜 응답 반환)
      likeComment: jest.fn().mockImplementation(() => Promise.resolve({
        statusCode: 200,
        message: '댓글에 좋아요를 눌렀습니다.',
        likeCount: 1,
      })),
    };

    // 테스트 모듈 설정
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CommentController],
      providers: [{ provide: CommentService, useValue: mockCommentService }],
    }).compile();

    controller = module.get<CommentController>(CommentController);
  });

  // CommentController가 정의되었는지 확인
  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  // createComment 메서드 테스트
  describe('createComment', () => {
    it('should create a comment successfully', async () => {
      const createCommentDto: CreateCommentDto = { content: 'Test comment' };
      const req = { user: { userId: 1 } } as any;

      const result = await controller.createComment(req, 1, createCommentDto);

      // 결과가 예상한 값과 일치하는지 확인

      expect(result).toEqual({
        statusCode: 201,
        message: '댓글이 성공적으로 작성되었습니다.',
        commentId: 1,
      });
    });

    // 빈 내용일 경우 BadRequestException을 발생시키는지 확인
    it('should throw BadRequestException when content is empty', async () => {
      const createCommentDto: CreateCommentDto = { content: '' };
      const req = { user: { userId: 1 } } as any;
      
      // 서비스 메서드가 BadRequestException을 던지도록 설정
      jest.spyOn(mockCommentService, 'createComment').mockImplementation(() => {
        throw new BadRequestException('댓글 작성에 실패했습니다. 내용을 입력해주세요.');
      });

      // BadRequestException이 발생하는지 확인
      await expect(controller.createComment(req, 1, createCommentDto)).rejects.toThrow(BadRequestException);
    });
  });

  // updateComment 메서드 테스트
  describe('updateComment', () => {
    it('should update a comment successfully', async () => {
      const updateCommentDto: UpdateCommentDto = { content: 'Updated comment' };
      const req = { user: { userId: 1 } } as any;

      const result = await controller.updateComment(req, 1, 1, updateCommentDto);

      // 결과가 예상한 값과 일치하는지 확인
      expect(result).toEqual({
        statusCode: 200,
        message: '댓글이 성공적으로 수정되었습니다.',
      });
    });

    // 댓글을 찾지 못했을 경우 NotFoundException을 발생시키는지 확인
    it('should throw NotFoundException when comment is not found', async () => {
      const updateCommentDto: UpdateCommentDto = { content: 'Updated comment' };
      const req = { user: { userId: 1 } } as any;
      
      // 서비스 메서드가 NotFoundException을 던지도록 설정
      jest.spyOn(mockCommentService, 'updateComment').mockImplementation(() => {
        throw new NotFoundException('댓글을 찾을 수 없습니다.');
      });

      // NotFoundException이 발생하는지 확인
      await expect(controller.updateComment(req, 1, 999, updateCommentDto)).rejects.toThrow(NotFoundException);
    });
  });

  // deleteComment 메서드 테스트
  describe('deleteComment', () => {
    it('should delete a comment successfully', async () => {
      const req = { user: { userId: 1 } } as any;

      const result = await controller.deleteComment(req, 1, 1);

      expect(result).toEqual({
        statusCode: 200,
        message: '댓글이 성공적으로 삭제되었습니다.',
      });
    });

    it('should throw NotFoundException when comment is not found', async () => {
      const req = { user: { userId: 1 } } as any;
      
      // 서비스 메서드가 NotFoundException을 던지도록 설정
      jest.spyOn(mockCommentService, 'deleteComment').mockImplementation(() => {
        throw new NotFoundException('댓글을 찾을 수 없습니다.');
      });

      // NotFoundException이 발생하는지 확인
      await expect(controller.deleteComment(req, 1, 999)).rejects.toThrow(NotFoundException);
    });
  });

  // likeComment 메서드 테스트

  describe('likeComment', () => {
    it('should like a comment successfully', async () => {
      const req = { user: { userId: 1 } } as any;

      const result = await controller.likeComment(req, 1, 1);

      expect(result).toEqual({
        statusCode: 200,
        message: '댓글에 좋아요를 눌렀습니다.',
        likeCount: 1,
      });
    });

    // 좋아요 취소할 경우의 테스트
    it('should unlike a comment successfully', async () => {
      const req = { user: { userId: 1 } } as any;
      
      // 서비스 메서드가 좋아요 취소 결과를 반환하도록 설정
      jest.spyOn(mockCommentService, 'likeComment').mockImplementation(() => Promise.resolve({
        statusCode: 200,
        message: '댓글 좋아요를 취소했습니다.',
        likeCount: 0,
      }));

      const result = await controller.likeComment(req, 1, 1);

      // 결과가 예상한 값과 일치하는지 확인
      expect(result).toEqual({
        statusCode: 200,
        message: '댓글 좋아요를 취소했습니다.',
        likeCount: 0,
      });
    });

    // 댓글을 찾지 못했을 경우 NotFoundException을 발생시키는지 확인
    it('should throw NotFoundException when comment is not found', async () => {
      const req = { user: { userId: 1 } } as any;
      
      jest.spyOn(mockCommentService, 'likeComment').mockImplementation(() => {
        throw new NotFoundException('댓글을 찾을 수 없습니다.');
      });

      // NotFoundException이 발생하는지 확인
      await expect(controller.likeComment(req, 1, 999)).rejects.toThrow(NotFoundException);
    });
  });
});