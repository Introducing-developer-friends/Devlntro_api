import { Injectable, NotFoundException, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Post } from '../entities/post.entity';
import { PostLike } from '../entities/post-like.entity';
import { CreatePostDto, UpdatePostDto } from './dto/post.dto';
import { S3Service } from '../s3/s3.service';


@Injectable()
export class PostService {
  constructor(
    @InjectRepository(Post)
    private postRepository: Repository<Post>, // Post 엔티티에 대한 TypeORM 리포지토리 주입
    @InjectRepository(PostLike)
    private postLikeRepository: Repository<PostLike>, // PostLike 엔티티에 대한 TypeORM 리포지토리 주입
    private s3Service: S3Service
  ) {}

  async createPost(userId: number, createPostData: { content: string; imageUrl: string | null }) {
    // 게시물 데이터 저장
    const post = this.postRepository.create({
      content: createPostData.content,
      image_url: createPostData.imageUrl,  // 여기에서 image_url을 저장하도록 수정
      user: { user_id: userId },
    });

    try {
      const savedPost = await this.postRepository.save(post);
      return {
        statusCode: 201,
        message: '게시물이 성공적으로 작성되었습니다.',
        postId: savedPost.post_id,
        imageUrl: savedPost.image_url,  // 응답에서 imageUrl 반환
      };
    } catch (error) {
      console.error('Error saving post to database:', error);
      throw new InternalServerErrorException('게시물을 데이터베이스에 저장하는 중 오류가 발생했습니다.');
    }
  }

  async updatePost(userId: number, postId: number, updatePostData: { content?: string; imageUrl?: string | null }) {
    const post = await this.postRepository.findOne({
      where: { post_id: postId, user: { user_id: userId } },
    });

    if (!post) {
      throw new NotFoundException('게시물을 찾을 수 없습니다.');
    }

    if (updatePostData.content !== undefined) {
      post.content = updatePostData.content;
    }

    if (updatePostData.imageUrl !== undefined) {
      // 기존 이미지가 있고 새 이미지와 다르다면 S3에서 삭제
      if (post.image_url && post.image_url !== updatePostData.imageUrl) {
        const oldKey = this.extractKeyFromUrl(post.image_url);
        if (oldKey) {
          await this.s3Service.deleteFile(oldKey);
        }
      }
      post.image_url = updatePostData.imageUrl;
    }

    await this.postRepository.save(post);

    return {
      statusCode: 200,
      message: '게시물이 성공적으로 수정되었습니다.',
    };
  }

  // URL에서 S3 키 추출 메서드
  private extractKeyFromUrl(url: string): string | null {
    const match = url.match(/amazonaws\.com\/(.+)$/);
    return match ? match[1] : null;
  }

  // 게시물 삭제 메서드 
  async deletePost(userId: number, postId: number) {
    const post = await this.postRepository.findOne({
      where: { post_id: postId, user: { user_id: userId } },
    });

    if (!post) {
      throw new NotFoundException('게시물을 찾을 수 없습니다.');
    }

    if (post.image_url) {
      const key = this.extractKeyFromUrl(post.image_url);
      if (key) {
        await this.s3Service.deleteFile(key);
      }
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