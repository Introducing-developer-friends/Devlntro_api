import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, EntityManager } from 'typeorm';
import { Post } from '../entities/post.entity';
import { PostLike } from '../entities/post-like.entity';
import { S3Service } from '../s3/s3.service';
import {
  PostCreateData,
  PostUpdateData,
  PostBasicInfo,
  PostLikeInfo,
} from '../types/post.types';

@Injectable()
export class PostService {
  constructor(
    @InjectRepository(Post)
    private readonly postRepository: Repository<Post>, // Post 엔티티에 대한 TypeORM 리포지토리 주입
    @InjectRepository(PostLike)
    private readonly postLikeRepository: Repository<PostLike>, // PostLike 엔티티에 대한 TypeORM 리포지토리 주입
    private readonly s3Service: S3Service,
    private readonly entityManager: EntityManager,
  ) {}

  // 게시물을 생성하는 메서드
  async createPost(
    userId: number,
    createPostData: PostCreateData,
  ): Promise<PostBasicInfo> {
    try {
      // 단일 INSERT 쿼리로 처리
      const result = await this.postRepository
        .createQueryBuilder()
        .insert()
        .into(Post)
        .values({
          content: createPostData.content,
          image_url: createPostData.imageUrl,
          user: { user_id: userId },
        })
        .execute();
      // 저장된 게시물 정보를 반환
      return {
        postId: result.identifiers[0].post_id,
        content: createPostData.content,
        imageUrl: createPostData.imageUrl,
        likeCount: 0,
      };
    } catch {
      throw new InternalServerErrorException(
        '게시물을 저장하는 중 오류가 발생했습니다.',
      );
    }
  }

  // 게시물을 수정하는 메서드
  async updatePost(
    userId: number,
    postId: number,
    updatePostData: PostUpdateData,
  ): Promise<void> {
    // 이미지 변경이 있는 경우만 이전 이미지 URL 조회
    let oldImageUrl: string | null = null;
    if (updatePostData.imageUrl !== undefined) {
      const post = await this.postRepository
        .createQueryBuilder('post')
        .select('post.image_url')
        .where('post.post_id = :postId', { postId })
        .andWhere('post.user_id = :userId', { userId })
        .getOne();

      if (!post) {
        throw new NotFoundException('게시물을 찾을 수 없습니다.');
      }
      oldImageUrl = post.image_url;
    }

    // 업데이트 실행
    const updateResult = await this.postRepository
      .createQueryBuilder()
      .update(Post)
      .set({
        ...(updatePostData.content !== undefined && {
          content: updatePostData.content,
        }),
        ...(updatePostData.imageUrl !== undefined && {
          image_url: updatePostData.imageUrl,
        }),
      })
      .where('post_id = :postId', { postId })
      .andWhere('user_id = :userId', { userId })
      .execute();

    if (updateResult.affected === 0) {
      throw new NotFoundException('게시물을 찾을 수 없습니다.');
    }

    // 이미지가 변경된 경우만 S3 처리
    if (
      oldImageUrl &&
      updatePostData.imageUrl &&
      oldImageUrl !== updatePostData.imageUrl
    ) {
      const oldKey = this.extractKeyFromUrl(oldImageUrl);
      if (oldKey) {
        try {
          await this.s3Service.deleteFile(oldKey);
        } catch (error) {
          console.error('이미지 삭제 실패:', error);
        }
      }
    }
  }

  // 게시물 삭제 메서드
  async deletePost(userId: number, postId: number): Promise<void> {
    // 이미지 URL만 조회
    const post = await this.postRepository
      .createQueryBuilder('post')
      .select('post.image_url')
      .where('post.post_id = :postId', { postId })
      .andWhere('post.user_id = :userId', { userId })
      .getOne();

    if (!post) {
      throw new NotFoundException('게시물을 찾을 수 없습니다.');
    }

    // soft delete 실행
    await this.postRepository
      .createQueryBuilder()
      .softDelete()
      .where('post_id = :postId', { postId })
      .andWhere('user_id = :userId', { userId })
      .execute();

    // 이미지가 있었다면 S3에서 삭제
    if (post.image_url) {
      const key = this.extractKeyFromUrl(post.image_url);
      if (key) {
        try {
          await this.s3Service.deleteFile(key);
        } catch (error) {
          console.error('이미지 삭제 실패:', error);
        }
      }
    }
  }

  async likePost(userId: number, postId: number): Promise<PostLikeInfo> {
    try {
      try {
        // 좋아요 추가 시도
        await this.postLikeRepository
          .createQueryBuilder()
          .insert()
          .into(PostLike)
          .values({
            post: { post_id: postId },
            userAccount: { user_id: userId },
          })
          .execute();

        // 카운트 증가 (SQL 레벨에서 처리)
        await this.postRepository
          .createQueryBuilder()
          .update(Post)
          .set({
            post_like_count: () => 'post_like_count + 1',
          })
          .where('post_id = :postId', { postId })
          .execute();

        // 현재 정확한 좋아요 수 조회
        const updatedPost = await this.postRepository.findOne({
          where: { post_id: postId },
          select: ['post_like_count'],
        });

        return {
          isLiked: true,
          likeCount: updatedPost?.post_like_count || 0,
        };
      } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
          // 좋아요 제거
          await this.postLikeRepository.delete({
            post: { post_id: postId },
            userAccount: { user_id: userId },
          });

          // 카운트 감소 (SQL 레벨에서 처리)
          await this.postRepository
            .createQueryBuilder()
            .update(Post)
            .set({
              post_like_count: () => 'post_like_count - 1',
            })
            .where('post_id = :postId', { postId })
            .execute();

          // 현재 정확한 좋아요 수 조회
          const updatedPost = await this.postRepository.findOne({
            where: { post_id: postId },
            select: ['post_like_count'],
          });

          return {
            isLiked: false,
            likeCount: updatedPost?.post_like_count || 0,
          };
        }

        if (error.code === 'ER_NO_REFERENCED_ROW_2') {
          throw new NotFoundException('게시물을 찾을 수 없습니다.');
        }

        throw error;
      }
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      console.error('Like post error:', error);
      throw new InternalServerErrorException(
        '좋아요 처리 중 오류가 발생했습니다.',
      );
    }
  }

  // URL에서 S3 키 추출 메서드
  private extractKeyFromUrl(url: string): string | null {
    const match = url.match(/amazonaws\.com\/(.+)$/);
    return match ? match[1] : null;
  }
}
