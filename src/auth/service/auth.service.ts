import { Injectable, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, QueryRunner, MoreThan } from 'typeorm';
import { UserAccount } from '../../user/entity/user-account.entity';
import { BusinessProfile } from '../../user/entity/business-profile.entity';
import { CreateUserDto } from '../dto/create-user.dto';
import { LoginDto } from '../dto/login.dto';
import * as bcrypt from 'bcrypt';
import {
  AuthResult,
  IdCheckResult,
  TokenPayload,
  RegisterResult,
} from '../../types/auth.type';
import { RefreshToken } from '../entity/refresh-token.entity';
import { ConfigService } from '@nestjs/config';
import { ErrorMessageType } from '../../enums/error.message.enum';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(UserAccount)
    private readonly userRepository: Repository<UserAccount>,
    @InjectRepository(RefreshToken)
    private readonly refreshTokenRepository: Repository<RefreshToken>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async checkIdAvailability(login_id: string): Promise<IdCheckResult> {
    const user = await this.userRepository
      .createQueryBuilder('user')
      .where('user.login_id = :login_id', { login_id })
      .getCount();

    return { available: !user };
  }

  private async validateRegistrationData(
    createUserDto: CreateUserDto,
    queryRunner: QueryRunner,
  ): Promise<void> {
    const { login_id, password, confirm_password } = createUserDto;

    if (password !== confirm_password) {
      throw new BadRequestException(ErrorMessageType.PASSWORD_MISMATCH);
    }

    const existingUser = await queryRunner.manager
      .createQueryBuilder(UserAccount, 'user')
      .where('user.login_id = :login_id', { login_id })
      .getOne();

    if (existingUser) {
      throw new BadRequestException(ErrorMessageType.EXISTING_USER_ID);
    }
  }

  async register(createUserDto: CreateUserDto): Promise<RegisterResult> {
    const queryRunner =
      this.userRepository.manager.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      await this.validateRegistrationData(createUserDto, queryRunner);

      const { login_id, password, name, ...profileData } = createUserDto;
      const hashedPassword = await bcrypt.hash(password, 10);

      const user = queryRunner.manager.create(UserAccount, {
        login_id,
        password: hashedPassword,
        confirm_password: hashedPassword,
        name,
      });
      await queryRunner.manager.save(user);

      const profile = queryRunner.manager.create(BusinessProfile, {
        ...profileData,
        userAccount: user,
      });
      await queryRunner.manager.save(profile);

      await queryRunner.commitTransaction();

      return { userId: user.user_id };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async login(loginDto: LoginDto): Promise<AuthResult | null> {
    const user = await this.userRepository
      .createQueryBuilder('user')
      .select(['user.user_id', 'user.login_id', 'user.password'])
      .where('user.login_id = :login_id', { login_id: loginDto.login_id })
      .getOne();

    if (!user || !(await bcrypt.compare(loginDto.password, user.password))) {
      return null;
    }

    return this.createTokens(user);
  }

  private async createTokens(user: UserAccount): Promise<AuthResult> {
    const tokenVersion = Math.floor(Date.now() / 1000);

    const accessPayload = {
      username: user.login_id,
      sub: user.user_id,
      type: 'access',
      version: tokenVersion,
    };

    const refreshPayload = {
      username: user.login_id,
      sub: user.user_id,
      type: 'refresh',
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(accessPayload, { expiresIn: '1h' }),

      this.jwtService.signAsync(refreshPayload, { expiresIn: '7d' }),
    ]);

    await this.userRepository.update(
      { user_id: user.user_id },
      { currentTokenVersion: tokenVersion },
    );

    await this.refreshTokenRepository.save({
      user,
      token: refreshToken,
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    return {
      accessToken,
      refreshToken,
      userId: user.user_id,
    };
  }

  async refreshAccessToken(
    refreshToken: string,
  ): Promise<{ accessToken: string } | null> {
    try {
      const now = new Date();
      const tokenEntity = await this.refreshTokenRepository.findOne({
        where: {
          token: refreshToken,
          expires_at: MoreThan(now),
          deleted_at: null,
        },
        relations: ['user'],
      });

      const payload = await this.jwtService.verifyAsync<TokenPayload>(
        refreshToken,
        {
          secret: this.configService.get<string>('JWT_SECRET'),
        },
      );

      if (payload.type !== 'refresh') {
        return null;
      }

      const tokenVersion = Math.floor(Date.now() / 1000);

      const newAccessToken = await this.jwtService.signAsync(
        {
          username: tokenEntity.user.login_id,
          sub: tokenEntity.user.user_id,
          type: 'access',
          version: tokenVersion,
        },
        { expiresIn: '1h' },
      );

      await this.userRepository.update(
        { user_id: tokenEntity.user.user_id },
        { currentTokenVersion: tokenVersion },
      );

      return { accessToken: newAccessToken };
    } catch (error) {
      console.error('Error in refreshAccessToken:', error);
      return null;
    }
  }

  async logout(userId: number): Promise<void> {
    try {
      const now = new Date();

      const hasActiveTokens = await this.refreshTokenRepository
        .createQueryBuilder('refreshToken')
        .where('refreshToken.user_id = :userId', { userId })
        .andWhere('refreshToken.deleted_at IS NULL')
        .getCount();

      if (hasActiveTokens === 0) {
        throw new BadRequestException(ErrorMessageType.ALREADY_LOGGED_OUT);
      }

      const result = await this.refreshTokenRepository
        .createQueryBuilder()
        .update(RefreshToken)
        .set({ deleted_at: now })
        .where('user_id = :userId', { userId })
        .andWhere('deleted_at IS NULL')
        .execute();

      if (!result.affected) {
        throw new BadRequestException(ErrorMessageType.FAILED_LOGOUT);
      }
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      console.error('Error during logout:', error);
      throw error;
    }
  }
}
