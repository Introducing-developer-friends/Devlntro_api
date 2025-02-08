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
  private readonly logger = new Logger(UserService.name);
  constructor(
    @InjectRepository(UserAccount)
    private readonly userAccountRepository: Repository<UserAccount>,

    @InjectRepository(BusinessProfile)
    private readonly businessProfileRepository: Repository<BusinessProfile>,
    private readonly dataSource: DataSource,
    private readonly authService: AuthService,
  ) {}

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

  async updateBusinessProfile(
    userId: number,
    updateProfileDto: UpdateBusinessProfileDto,
  ): Promise<BusinessProfileInfo> {
    return this.dataSource.manager.transaction(
      async (transactionalEntityManager) => {
        try {
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

          const { name, ...profileData } = updateProfileDto;

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

    await this.validateUserPassword(userId, currentPassword);

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
    await this.validateUserPassword(userId, deleteAccountDto.password);

    try {
      await this.authService.logout(userId);

      await this.businessProfileRepository
        .createQueryBuilder()
        .softDelete()
        .where('user_id = :userId', { userId })
        .execute();

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
