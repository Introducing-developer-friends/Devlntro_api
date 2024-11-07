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
    
    const queryRunner = this.postRepository.manager.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    
    // 게시물 데이터 저장
    try {
    const post = this.postRepository.create({
      content: createPostData.content,
      image_url: createPostData.imageUrl,  // 여기에서 image_url을 저장하도록 수정
      user: { user_id: userId },
    });

      const savedPost = await this.postRepository.save(post);
      await queryRunner.commitTransaction();

      // 저장된 게시물 정보를 반환
      return {
        postId: savedPost.post_id,
        content: savedPost.content,
        imageUrl: savedPost.image_url,
        likeCount: 0
      };

    } catch (error) {
      await queryRunner.rollbackTransaction(); // 오류 발생 시 트랜잭션 롤백
      throw new InternalServerErrorException('게시물을 데이터베이스에 저장하는 중 오류가 발생했습니다.');
    } finally {
      await queryRunner.release();
    }
  }

  // 게시물을 수정하는 메서드
  async updatePost(userId: number, postId: number, updatePostData: PostUpdateData): Promise<void> {
    const post = await this.postRepository.findOne({
      where: { post_id: postId, user: { user_id: userId } },
    });

    // 게시물 내용 업데이트
    if (!post) {
      throw new NotFoundException('게시물을 찾을 수 없습니다.');
    }

    // 이미지 업데이트
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
      post.image_url = updatePostData.imageUrl; // 새 이미지 URL 설정
    }

    await this.postRepository.save(post); // 게시물 저장

  }

  // 게시물 삭제 메서드 
  async deletePost(userId: number, postId: number): Promise<void> {
    const post = await this.postRepository.findOne({
      where: { post_id: postId, user: { user_id: userId } },
    });

    if (!post) {
      throw new NotFoundException('게시물을 찾을 수 없습니다.');
    }

    // 이미지가 있으면 S3에서 이미지 삭제
    if (post.image_url) {
      const key = this.extractKeyFromUrl(post.image_url);
      if (key) {
        await this.s3Service.deleteFile(key);
      }
    }

    await this.postRepository.softRemove(post);

  }

  async likePost(userId: number, postId: number): Promise<PostLikeInfo> {

    return this.entityManager.transaction(async transactionalEntityManager => {
      
      // 게시물에 대한 행 잠금을 설정하여 동시성 문제 방지
      const post = await transactionalEntityManager
        .createQueryBuilder(Post, "post")
        .setLock("pessimistic_write")
        .where("post.post_id = :postId", { postId })
        .getOne();

      if (!post) {
        throw new NotFoundException('게시물을 찾을 수 없습니다.');
      }

      const existingLike = await transactionalEntityManager.findOne(PostLike, {
        where: { post: { post_id: postId }, userAccount: { user_id: userId } }
      });

      let isLiked: boolean;

      if (existingLike) {
        await transactionalEntityManager.remove(existingLike);
        post.post_like_count -= 1;
        isLiked = false;
      } else {
        try {
        const newLike = transactionalEntityManager.create(PostLike, {
          post: { post_id: postId },
          userAccount: { user_id: userId }
        });
        await transactionalEntityManager.save(newLike);
        post.post_like_count += 1;
        isLiked = true;
      } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
          throw new ConflictException('이미 이 게시물에 좋아요를 누르셨습니다.');
        }
        throw error;
      }
    }

      await transactionalEntityManager.save(post);

      return {
        isLiked,
        likeCount: post.post_like_count
      };
    });
  }

  // URL에서 S3 키 추출 메서드
  private extractKeyFromUrl(url: string): string | null {
    const match = url.match(/amazonaws\.com\/(.+)$/);
    return match ? match[1] : null;
  }
}