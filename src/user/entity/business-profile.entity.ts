import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  JoinColumn,
  DeleteDateColumn,
} from 'typeorm';
import { UserAccount } from './user-account.entity';

@Entity()
export class BusinessProfile {
  @PrimaryGeneratedColumn({ name: 'business_profile_id' })
  profile_id: number;

  @OneToOne(() => UserAccount, (userAccount) => userAccount.profile)
  @JoinColumn({ name: 'user_id' })
  userAccount: UserAccount;

  @Column({
    type: 'varchar',
    length: 100,
    nullable: false,
  })
  company: string;

  @Column({
    type: 'varchar',
    length: 100,
    nullable: false,
  })
  department: string;

  @Column({
    type: 'varchar',
    length: 100,
    nullable: false,
  })
  position: string;

  @Column({
    type: 'varchar',
    length: 100,
    nullable: false,
  })
  email: string;

  @Column({
    type: 'varchar',
    length: 50,
    nullable: false,
  })
  phone: string;

  @DeleteDateColumn({
    name: 'deleted_at',
    type: 'timestamp',
    nullable: true,
  })
  deletedAt: Date;
}
