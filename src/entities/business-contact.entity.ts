import { Entity, PrimaryGeneratedColumn, ManyToOne, JoinColumn, CreateDateColumn, DeleteDateColumn } from 'typeorm';
import { UserAccount } from './user-account.entity';

@Entity()
export class BusinessContact {
  @PrimaryGeneratedColumn()
  contact_id: number;

  @ManyToOne(() => UserAccount, userAccount => userAccount.contacts)
  @JoinColumn({ name: 'user_id' })
  userAccount: UserAccount;

  @ManyToOne(() => UserAccount, contact_user => contact_user.contactOf)
  @JoinColumn({ name: 'contact_user_id' })
  contact_user: UserAccount;

  @CreateDateColumn()
  created_at: Date;

  @DeleteDateColumn()
  deleted_at: Date;
}