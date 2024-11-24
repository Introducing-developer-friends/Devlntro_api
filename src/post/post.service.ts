import { Injectable, NotFoundException, InternalServerErrorException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, EntityManager  } from 'typeorm';
import { Post } from '../entities/post.entity';
import { PostLike } from '../entities/post-like.entity';
import { S3Service } from '../s3/s3.service';
import { 
  PostCreateData, 
  PostUpdateData,
  PostBasicInfo,
  PostLikeInfo
} from '../types/post.types';

@Injectable()
export class PostService {
  constructor(
    @InjectRepository(Post)
    private readonly  postRepository: Repository<Post>, // Post 엔티티에 대한 TypeORM 리포지토리 주입
    @InjectRepository(PostLike)
    private readonly  postLikeRepository: Repository<PostLike>, // PostLike 엔티티에 대한 TypeORM 리포지토리 주입
    private readonly  s3Service: S3Service,
    private readonly  entityManager: EntityManager
  ) {}

// 게시물을 생성하는 메서드
  async createPost(userId: number, createPostData: PostCreateData): Promise<PostBasicInfo> {
    try {
      // 단일 INSERT 쿼리로 처리
      const result = await this.postRepository
        .createQueryBuilder()
        .insert()
        .into(Post)
        .values({
          content: createPostData.content,
          image_url: createPostData.imageUrl,
          user: { user_id: userId }
        })
        .execute();
        // 저장된 게시물 정보를 반환 
      return {
        postId: result.identifiers[0].post_id,
        content: createPostData.content,
        imageUrl: createPostData.imageUrl,
        likeCount: 0
      };
    } catch (error) {
      throw new InternalServerErrorException('게시물을 저장하는 중 오류가 발생했습니다.');
    }
  }
  
  // 게시물을 수정하는 메서드
  async updatePost(userId: number, postId: number, updatePostData: PostUpdateData): Promise<void> {
    // 1. 먼저 게시물 존재 여부와 이전 이미지 URL 확인
    const post = await this.postRepository.findOne({
      select: ['post_id', 'image_url'],
      where: { 
        post_id: postId, 
        user: { user_id: userId } 
      }
    });
  
    if (!post) {
      throw new NotFoundException('게시물을 찾을 수 없습니다.');
    }
  
    // 2. 업데이트할 데이터 준비
    const updateData: any = {};
    let oldImageUrl = null;
  
    if (updatePostData.content !== undefined) {
      updateData.content = updatePostData.content;
    }
  
    if (updatePostData.imageUrl !== undefined) {
      oldImageUrl = post.image_url;
      updateData.image_url = updatePostData.imageUrl;
    }
  
    // 3. DB 업데이트 (단일 쿼리)
    if (Object.keys(updateData).length > 0) {
      await this.postRepository
        .createQueryBuilder()
        .update(Post)
        .set(updateData)
        .where("post_id = :postId AND user.user_id = :userId", { 
          postId, 
          userId 
        })
        .execute();
    }
  
    // 4. 이전 이미지 삭제 (DB 작업 성공 후)
    if (oldImageUrl && updatePostData.imageUrl && oldImageUrl !== updatePostData.imageUrl) {
      try {
        const oldKey = this.extractKeyFromUrl(oldImageUrl);
        if (oldKey) {
          await this.s3Service.deleteFile(oldKey);
        }
      } catch (error) {
        // S3 삭제 실패는 로깅만 하고 계속 진행
        console.error('S3 파일 삭제 실패:', error);
      }
    }
  }

  // 게시물 삭제 메서드 
  async deletePost(userId: number, postId: number): Promise<void> {
    const post = await this.postRepository.findOne({
      where: { post_id: postId, user: { user_id: userId } },
    });

    if (!post) {
      throw new NotFoundException('게시물을 찾을 수 없습니다.');
    }
    await this.postRepository.softRemove(post);

    // 이미지가 있으면 S3에서 이미지 삭제
    if (post.image_url) {
      try {
        const key = this.extractKeyFromUrl(post.image_url);
      if (key) {
        await this.s3Service.deleteFile(key);
      }
    } catch (error) {
      // S3 삭제 실패해도 로깅만 하고 계속 진행.
      console.log('Failed to delete image S3:', error);
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
            userAccount: { user_id: userId }
          })
          .execute();
  
        // 카운트 증가 (SQL 레벨에서 처리)
        await this.postRepository
          .createQueryBuilder()
          .update(Post)
          .set({ 
            post_like_count: () => 'post_like_count + 1' 
          })
          .where("post_id = :postId", { postId })
          .execute();
  
        // 현재 정확한 좋아요 수 조회
        const updatedPost = await this.postRepository.findOne({
          where: { post_id: postId },
          select: ['post_like_count']
        });
  
        return {
          isLiked: true,
          likeCount: updatedPost?.post_like_count || 0
        };
  
      } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
          // 좋아요 제거
          await this.postLikeRepository.delete({
            post: { post_id: postId },
            userAccount: { user_id: userId }
          });
  
          // 카운트 감소 (SQL 레벨에서 처리)
          await this.postRepository
            .createQueryBuilder()
            .update(Post)
            .set({ 
              post_like_count: () => 'post_like_count - 1' 
            })
            .where("post_id = :postId", { postId })
            .execute();
  
          // 현재 정확한 좋아요 수 조회
          const updatedPost = await this.postRepository.findOne({
            where: { post_id: postId },
            select: ['post_like_count']
          });
  
          return {
            isLiked: false,
            likeCount: updatedPost?.post_like_count || 0
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
      throw new InternalServerErrorException('좋아요 처리 중 오류가 발생했습니다.');
    }
  }

  // URL에서 S3 키 추출 메서드
  private extractKeyFromUrl(url: string): string | null {
    const match = url.match(/amazonaws\.com\/(.+)$/);
    return match ? match[1] : null;
  }
}