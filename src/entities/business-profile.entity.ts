import { Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn } from 'typeorm';
import { UserAccount } from './user-account.entity';

@Entity()
export class BusinessProfile {
  @PrimaryGeneratedColumn() // 프로필 고유 ID
  profile_id: number;

  @OneToOne(() => UserAccount, userAccount => userAccount.profile) // 사용자 계정과 1:1 관계
  @JoinColumn({ name: 'user_id' })
  userAccount: UserAccount;

  @Column()
  company: string;

  @Column()
  department: string;

  @Column()
  position: string;

  @Column()
  email: string;

  @Column()
  phone: string;
}