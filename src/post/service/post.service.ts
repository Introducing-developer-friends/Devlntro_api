import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Post } from '../entity/post.entity';
import { PostLike } from '../entity/post-like.entity';
import { S3Service } from '../../s3/service/s3.service';
import {
  PostCreateData,
  PostUpdateData,
  PostBasicInfo,
  PostLikeInfo,
} from '../../types/post.types';
import { ErrorMessageType } from '../../enums/error.message.enum';

@Injectable()
export class PostService {
  constructor(
    @InjectRepository(Post)
    private readonly postRepository: Repository<Post>,
    @InjectRepository(PostLike)
    private readonly postLikeRepository: Repository<PostLike>,
    private readonly s3Service: S3Service,
  ) {}

  async createPost(
    userId: number,
    createPostData: PostCreateData,
  ): Promise<PostBasicInfo> {
    try {
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

  async updatePost(
    userId: number,
    postId: number,
    updatePostData: PostUpdateData,
  ): Promise<void> {
    let oldImageUrl: string | null = null;
    if (updatePostData.imageUrl !== undefined) {
      const post = await this.postRepository
        .createQueryBuilder('post')
        .select('post.image_url')
        .where('post.post_id = :postId', { postId })
        .andWhere('post.user_id = :userId', { userId })
        .getOne();

      if (!post) {
        throw new NotFoundException(ErrorMessageType.NOT_FOUND_POST);
      }
      oldImageUrl = post.image_url;
    }

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
      throw new NotFoundException(ErrorMessageType.NOT_FOUND_POST);
    }

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

  async deletePost(userId: number, postId: number): Promise<void> {
    const post = await this.postRepository
      .createQueryBuilder('post')
      .select('post.image_url')
      .where('post.post_id = :postId', { postId })
      .andWhere('post.user_id = :userId', { userId })
      .getOne();

    if (!post) {
      throw new NotFoundException(ErrorMessageType.NOT_FOUND_POST);
    }

    await this.postRepository
      .createQueryBuilder()
      .softDelete()
      .where('post_id = :postId', { postId })
      .andWhere('user_id = :userId', { userId })
      .execute();

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
        await this.postLikeRepository
          .createQueryBuilder()
          .insert()
          .into(PostLike)
          .values({
            post: { post_id: postId },
            userAccount: { user_id: userId },
          })
          .execute();

        await this.postRepository
          .createQueryBuilder()
          .update(Post)
          .set({
            post_like_count: () => 'post_like_count + 1',
          })
          .where('post_id = :postId', { postId })
          .execute();

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
          await this.postLikeRepository.delete({
            post: { post_id: postId },
            userAccount: { user_id: userId },
          });

          await this.postRepository
            .createQueryBuilder()
            .update(Post)
            .set({
              post_like_count: () => 'post_like_count - 1',
            })
            .where('post_id = :postId', { postId })
            .execute();

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
          throw new NotFoundException(ErrorMessageType.NOT_FOUND_POST);
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

  private extractKeyFromUrl(url: string): string | null {
    const match = url.match(/amazonaws\.com\/(.+)$/);
    return match ? match[1] : null;
  }
}
