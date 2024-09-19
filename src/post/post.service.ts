import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Post } from '../entities/post.entity';
import { PostLike } from '../entities/post-like.entity';
import { CreatePostDto, UpdatePostDto } from './dto/post.dto';
import * as fs from 'fs';
import * as path from 'path';


@Injectable()
export class PostService {
  constructor(
    @InjectRepository(Post)
    private postRepository: Repository<Post>,
    @InjectRepository(PostLike)
    private postLikeRepository: Repository<PostLike>,
  ) {}

  async createPost(userId: number, createPostDto: CreatePostDto, file?: Express.Multer.File) {
    let filepath = null;

    if (file) {

      // 고유한 파일 이름 생성
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const filename = file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname);
      filepath = path.join('uploads', filename);

      fs.writeFileSync(filepath, file.buffer); // 파일 저장
    }

    const post = this.postRepository.create({
      ...createPostDto,
      user: { user_id: userId }, // 작성자 정보 추가
      image_url: filepath, // 파일이 없으면 null로 저장
    });

    await this.postRepository.save(post);

    return {
      statusCode: 201,
      message: '게시물이 성공적으로 작성되었습니다.',
      postId: post.post_id,
    };
  }


  async updatePost(userId: number, postId: number, updatePostDto: UpdatePostDto, file?: Express.Multer.File) {
    const post = await this.postRepository.findOne({
      where: { post_id: postId, user: { user_id: userId } }, // 게시물과 작성자 확인(본인 게시물 검증)
    });

    if (!post) {
      throw new NotFoundException('게시물을 찾을 수 없습니다.'); // 게시물이 없을 경우 예외 발생
    }

    if (file) {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const filename = file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname);
      const filepath = path.join('uploads', filename);

      fs.writeFileSync(filepath, file.buffer); // 새 파일 저장

      if (post.image_url) {
        fs.unlinkSync(post.image_url); // 기존 파일 삭제
      }

      post.image_url = filepath; // 새로운 이미지 경로 저장
    }

    Object.assign(post, updatePostDto); // DTO로 받은 업데이트 정보 적용

    await this.postRepository.save(post);

    return {
      statusCode: 200,
      message: '게시물이 성공적으로 수정되었습니다.',
    };
  }

  async deletePost(userId: number, postId: number) {
    const post = await this.postRepository.findOne({
      where: { post_id: postId, user: { user_id: userId } }, // 게시물과 작성자 확인
    });

    if (!post) {
      throw new NotFoundException('게시물을 찾을 수 없습니다.');
    }

    if (post.image_url) {
      fs.unlinkSync(post.image_url); // 이미지 파일 삭제
    }

    await this.postRepository.softRemove(post);

    return {
      statusCode: 200,
      message: '게시물이 성공적으로 삭제되었습니다.',
    };
  }

  async likePost(userId: number, postId: number) {
    const post = await this.postRepository.findOne({
      where: { post_id: postId },
    });

    if (!post) {
      throw new NotFoundException('게시물을 찾을 수 없습니다.');
    }

    const existingLike = await this.postLikeRepository.findOne({
      where: { post: { post_id: postId }, userAccount: { user_id: userId } }, // 기존 좋아요 확인
    });

    if (existingLike) {
      await this.postLikeRepository.remove(existingLike); // 기존 좋아요 삭제
      post.post_like_count -= 1; // 좋아요 수 감소
      await this.postRepository.save(post);

      return {
        statusCode: 200,
        message: '게시물 좋아요를 취소했습니다.',
        likeCount: post.post_like_count,
      };
    } else {
      const newLike = this.postLikeRepository.create({
        post: { post_id: postId }, // 새 좋아요 생성
        userAccount: { user_id: userId },
      });
      await this.postLikeRepository.save(newLike);

      post.post_like_count += 1; // 좋아요 수 증가
      await this.postRepository.save(post);

      return {
        statusCode: 200,
        message: '게시물에 좋아요를 눌렀습니다.',
        likeCount: post.post_like_count,
      };
    }
  }
}