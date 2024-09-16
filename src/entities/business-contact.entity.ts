import { Entity, PrimaryGeneratedColumn, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { UserAccount } from './user-account.entity';

@Entity()
export class BusinessContact {
  @PrimaryGeneratedColumn() // 자동으로 증가하는 기본 키
  contact_id: number;

  @ManyToOne(() => UserAccount, userAccount => userAccount.contacts)
  @JoinColumn({ name: 'user_id' }) // 외래 키인 user_id로 연결
  userAccount: UserAccount;

  @ManyToOne(() => UserAccount, contact_user => contact_user.contactOf)
  @JoinColumn({ name: 'contact_user_id' }) 
  contact_user: UserAccount;
}