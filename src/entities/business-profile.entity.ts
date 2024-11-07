import { Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn, DeleteDateColumn  } from 'typeorm';
import { UserAccount } from './user-account.entity';

// BusinessProfile 엔티티는 사용자의 비즈니스 프로필 정보를 나타냅니다.
@Entity()
export class BusinessProfile {
  @PrimaryGeneratedColumn() // 프로필 고유 ID
  profile_id: number;

  @OneToOne(() => UserAccount, userAccount => userAccount.profile) // 사용자 계정과 1:1 관계
  @JoinColumn({ name: 'user_id' })
  userAccount: UserAccount;

  @Column({
    type: 'varchar', 
    length: 100, 
    nullable: false 
})
  company: string;

  @Column({
    type: 'varchar', 
    length: 100, 
    nullable: false 
})
  department: string;

  @Column({
    type: 'varchar', 
    length: 100, 
    nullable: false 
})
  position: string;

  @Column({
    type: 'varchar', 
    length: 100, 
    nullable: false 
})
  email: string;

  @Column({
    type: 'varchar', 
    length: 20, 
    nullable: false 
})
  phone: string;

  @DeleteDateColumn({
    type: 'timestamp',
    nullable: true 
})
  deletedAt: Date;
}