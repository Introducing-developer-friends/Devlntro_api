// user.service.ts
import { Injectable, NotFoundException, BadRequestException, UnauthorizedException, Logger  } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource  } from 'typeorm';
import { UserAccount } from '../entities/user-account.entity';
import { BusinessProfile } from '../entities/business-profile.entity';
import { UpdateBusinessProfileDto } from './dto/update-business-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { DeleteAccountDto } from './dto/delete-account.dto';
import { BusinessProfileInfo } from '../types/user.types';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UserService {
  // Logger 인스턴스 생성
  private readonly logger = new Logger(UserService.name);

  constructor(

    // UserAccount 리포지토리를 주입
    @InjectRepository(UserAccount)
    private readonly  userAccountRepository: Repository<UserAccount>,

    // BusinessProfile 리포지토리를 주입
    @InjectRepository(BusinessProfile)
    private readonly  businessProfileRepository: Repository<BusinessProfile>,
    private readonly  dataSource: DataSource
  ) {}

  // 비즈니스 프로필 업데이트 메서드
  async updateBusinessProfile(
    userId: number, 
    updateProfileDto: UpdateBusinessProfileDto
  ): Promise<BusinessProfileInfo> {

    // 트랜잭션 사용
    return this.dataSource.manager.transaction(async transactionalEntityManager => {
      
      // UserAccount 엔티티에서 유저 정보를 조회 (프로필과 함께)
      const user = await transactionalEntityManager.findOne(UserAccount, { 
        where: { user_id: userId },
        relations: ['profile'] // 프로필 관계도 조회
      });
    
    // 사용자가 없으면 예외 발생
    if (!user) {
      throw new NotFoundException('사용자를 찾을 수 없습니다.');
    }

    // UserAccount 업데이트 (이름 필드만)
    if (updateProfileDto.name) {
        user.name = updateProfileDto.name;
        await transactionalEntityManager.save(UserAccount, user);
      }
      
      let profile: BusinessProfile;

      // BusinessProfile 업데이트
      if (!user.profile) {
        profile = transactionalEntityManager.create(BusinessProfile, {
          ...updateProfileDto,
          userAccount: user
        });
      } else {
        const { name, ...profileUpdateData } = updateProfileDto;
        profile = Object.assign(user.profile, profileUpdateData);
      }

    await transactionalEntityManager.save(BusinessProfile, profile);  
    return this.mapToBusinessProfileInfo(profile);
    });
  }

  // 비밀번호 변경 메서드
  async changePassword(
    userId: number, 
    changePasswordDto: ChangePasswordDto
  ): Promise<void> {

    // 트랜잭션 사용
    return this.dataSource.manager.transaction(async transactionalEntityManager => {
      const user = await transactionalEntityManager.findOne(UserAccount, { 
        where: { user_id: userId } 
      });
    
    // 사용자가 없으면 예외 발생
    if (!user) {
      throw new NotFoundException('사용자를 찾을 수 없습니다.');
    }

    const isPasswordValid = await bcrypt.compare(
      changePasswordDto.currentPassword, 
      user.password
    );

    // 현재 비밀번호가 올바른지 확인
    if (!isPasswordValid) {
      throw new UnauthorizedException('현재 비밀번호가 올바르지 않습니다.');
    }

    if (changePasswordDto.newPassword !== changePasswordDto.confirmNewPassword) {
      throw new BadRequestException('새 비밀번호와 확인 비밀번호가 일치하지 않습니다.');
    }

    user.password = await bcrypt.hash(changePasswordDto.newPassword, 10);
    await transactionalEntityManager.save(UserAccount, user);
  });
  }

  // 회원 탈퇴 메서드 (소프트 삭제)
  async deleteAccount(
    userId: number, 
    deleteAccountDto: DeleteAccountDto
  ): Promise<void> {
    return this.dataSource.manager.transaction(async transactionalEntityManager => {
      const user = await transactionalEntityManager.findOne(UserAccount, { 
        where: { user_id: userId },
        relations: ['profile']
      });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const isPasswordValid = await bcrypt.compare(
      deleteAccountDto.password, 
      user.password
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('비밀번호가 올바르지 않습니다.');
    }

    // 비즈니스 프로필 소프트 삭제
    if (user.profile) {
      await transactionalEntityManager.softDelete(BusinessProfile, user.profile.profile_id);
    }

    // 소프트 삭제 실행
    await transactionalEntityManager.softDelete(UserAccount, userId);

  });
  }

  // 비즈니스 프로필 정보를 BusinessProfileInfo 타입으로 변환하는 메서드
  private mapToBusinessProfileInfo(profile: BusinessProfile): BusinessProfileInfo {
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