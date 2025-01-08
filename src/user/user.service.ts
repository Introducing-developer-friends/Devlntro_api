// user.service.ts
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  UnauthorizedException,
  Logger,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { UserAccount } from '../entities/user-account.entity';
import { BusinessProfile } from '../entities/business-profile.entity';
import { UpdateBusinessProfileDto } from './dto/update-business-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { DeleteAccountDto } from './dto/delete-account.dto';
import { BusinessProfileInfo } from '../types/user.types';
import * as bcrypt from 'bcrypt';
import { AuthService } from '../auth/auth.service';

@Injectable()
export class UserService {
  // Logger 인스턴스 생성
  private readonly logger = new Logger(UserService.name);
  constructor(
    // UserAccount 리포지토리를 주입
    @InjectRepository(UserAccount)
    private readonly userAccountRepository: Repository<UserAccount>,

    // BusinessProfile 리포지토리를 주입
    @InjectRepository(BusinessProfile)
    private readonly businessProfileRepository: Repository<BusinessProfile>,
    private readonly dataSource: DataSource,
    private readonly authService: AuthService,
  ) {}

  // 비밀번호 검증 공통 로직
  private async validateUserPassword(
    userId: number,
    password: string,
  ): Promise<UserAccount> {
    const user = await this.userAccountRepository
      .createQueryBuilder('user')
      .select(['user.user_id', 'user.password'])
      .where('user.user_id = :userId', { userId })
      .getOne();

    if (!user) {
      throw new NotFoundException('사용자를 찾을 수 없습니다.');
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      throw new UnauthorizedException('비밀번호가 올바르지 않습니다.');
    }

    return user;
  }

  // 비즈니스 프로필 업데이트 메서드
  async updateBusinessProfile(
    userId: number,
    updateProfileDto: UpdateBusinessProfileDto,
  ): Promise<BusinessProfileInfo> {
    return this.dataSource.manager.transaction(
      async (transactionalEntityManager) => {
        try {
          // 필요한 필드만 조회
          const user = await transactionalEntityManager
            .createQueryBuilder(UserAccount, 'user')
            .leftJoinAndSelect('user.profile', 'profile')
            .select([
              'user.user_id',
              'user.name',
              'profile.profile_id',
              'profile.company',
              'profile.department',
              'profile.position',
              'profile.email',
              'profile.phone',
            ])
            .where('user.user_id = :userId', { userId })
            .getOne();

          if (!user) {
            throw new NotFoundException('사용자를 찾을 수 없습니다.');
          }

          // 프로필 업데이트 또는 생성
          const { name, ...profileData } = updateProfileDto;

          // 이름과 프로필 정보 동시 업데이트
          const updates = [];

          if (name) {
            user.name = name;
            updates.push(transactionalEntityManager.save(UserAccount, user));
          }

          const profile = user.profile
            ? Object.assign(user.profile, profileData)
            : transactionalEntityManager.create(BusinessProfile, {
                ...profileData,
                userAccount: user,
              });

          updates.push(
            transactionalEntityManager.save(BusinessProfile, profile),
          );

          // 모든 업데이트를 병렬로 처리
          await Promise.all(updates);

          return this.mapToBusinessProfileInfo(profile);
        } catch (error) {
          this.logger.error(
            `Error updating business profile: ${error.message}`,
          );
          throw error;
        }
      },
    );
  }
  // 비밀번호 변경 메서드
  async changePassword(
    userId: number,
    changePasswordDto: ChangePasswordDto,
  ): Promise<void> {
    const { currentPassword, newPassword, confirmNewPassword } =
      changePasswordDto;

    if (newPassword !== confirmNewPassword) {
      throw new BadRequestException(
        '새 비밀번호와 확인 비밀번호가 일치하지 않습니다.',
      );
    }

    // 공통 비밀번호 검증 로직 사용
    await this.validateUserPassword(userId, currentPassword);

    // 비밀번호 업데이트
    await this.userAccountRepository
      .createQueryBuilder()
      .update(UserAccount)
      .set({ password: await bcrypt.hash(newPassword, 10) })
      .where('user_id = :userId', { userId })
      .execute();
  }

  async deleteAccount(
    userId: number,
    deleteAccountDto: DeleteAccountDto,
  ): Promise<void> {
    // 비밀번호 검증
    await this.validateUserPassword(userId, deleteAccountDto.password);

    try {
      // 1. 로그아웃 처리 (리프레시 토큰 삭제)
      await this.authService.logout(userId);

      // 2. 비즈니스 프로필 소프트 삭제
      await this.businessProfileRepository
        .createQueryBuilder()
        .softDelete()
        .where('user_id = :userId', { userId })
        .execute();

      // 3. 유저 계정 소프트 삭제
      await this.userAccountRepository
        .createQueryBuilder()
        .softDelete()
        .where('user_id = :userId', { userId })
        .execute();
    } catch (error) {
      this.logger.error(`Error during account deletion: ${error.message}`);
      throw new InternalServerErrorException(
        '회원 탈퇴 처리 중 오류가 발생했습니다.',
      );
    }
  }

  // 비즈니스 프로필 정보를 BusinessProfileInfo 타입으로 변환하는 메서드
  private mapToBusinessProfileInfo(
    profile: BusinessProfile,
  ): BusinessProfileInfo {
    return {
      name: profile.userAccount?.name,
      company: profile.company,
      department: profile.department,
      position: profile.position,
      email: profile.email,
      phone: profile.phone,
    };
  }
}
