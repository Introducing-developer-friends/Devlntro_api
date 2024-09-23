// user.service.ts
import { Injectable, NotFoundException, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserAccount } from '../entities/user-account.entity';
import { BusinessProfile } from '../entities/business-profile.entity';
import { UpdateBusinessProfileDto } from './dto/update-business-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { DeleteAccountDto } from './dto/delete-account.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UserService {
  constructor(

    // UserAccount 리포지토리를 주입
    @InjectRepository(UserAccount)
    private userAccountRepository: Repository<UserAccount>,

    // BusinessProfile 리포지토리를 주입
    @InjectRepository(BusinessProfile)
    private businessProfileRepository: Repository<BusinessProfile>,
  ) {}

  // 비즈니스 프로필 업데이트 메서드
  async updateBusinessProfile(userId: number, updateProfileDto: UpdateBusinessProfileDto) {
    const user = await this.userAccountRepository.findOne({ where: { user_id: userId }, relations: ['profile'] });
    
    // 사용자가 없으면 예외 발생
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // UserAccount 업데이트 (이름 필드만)
    if (updateProfileDto.name) {
        user.name = updateProfileDto.name;
        await this.userAccountRepository.save(user);
      }
  
      // BusinessProfile 업데이트
      if (!user.profile) {
        const newProfile = this.businessProfileRepository.create({
          ...updateProfileDto,
          userAccount: user
        });
        await this.businessProfileRepository.save(newProfile);
      } else {
        // 이름 필드를 제외한 나머지 필드만 업데이트
        const { name, ...profileUpdateData } = updateProfileDto;
        Object.assign(user.profile, profileUpdateData);
        await this.businessProfileRepository.save(user.profile);
      }

    // 변경된 사용자 정보를 저장
    await this.userAccountRepository.save(user);
    return {
      statusCode: 200,
      message: "프로필 정보가 성공적으로 수정되었습니다."
    };
  }

  // 비밀번호 변경 메서드
  async changePassword(userId: number, changePasswordDto: ChangePasswordDto) {
    
    // 주어진 userId로 사용자를 찾음
    const user = await this.userAccountRepository.findOne({ where: { user_id: userId } });
    
    // 사용자가 없으면 예외 발생
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // 현재 비밀번호가 올바른지 확인
    const isPasswordValid = await bcrypt.compare(changePasswordDto.currentPassword, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('현재 비밀번호가 올바르지 않습니다.');
    }

    if (changePasswordDto.newPassword !== changePasswordDto.confirmNewPassword) {
      throw new BadRequestException('새 비밀번호와 확인 비밀번호가 일치하지 않습니다.');
    }

    user.password = await bcrypt.hash(changePasswordDto.newPassword, 10);
    await this.userAccountRepository.save(user);
    
    return {
      statusCode: 200,
      message: "비밀번호가 성공적으로 변경되었습니다." // 성공 메시지 반환
    };
  }

  async deleteAccount(userId: number, deleteAccountDto: DeleteAccountDto) {
    const user = await this.userAccountRepository.findOne({ where: { user_id: userId } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const isPasswordValid = await bcrypt.compare(deleteAccountDto.password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('비밀번호가 올바르지 않습니다.');
    }

    // 소프트 삭제 실행
    await this.userAccountRepository.softDelete(userId);

    return {
      statusCode: 200,
      message: "회원 탈퇴가 성공적으로 처리되었습니다."
    };
  }


}