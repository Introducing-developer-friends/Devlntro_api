import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  DeleteDateColumn,
} from 'typeorm';
import { UserAccount } from '../../user/entity/user-account.entity';

@Entity()
export class RefreshToken {
  @PrimaryGeneratedColumn()
  refresh_token_id: number;

  @ManyToOne(() => UserAccount, (user) => user.refreshTokens, {
    nullable: false,
  })
  @JoinColumn({ name: 'user_id' })
  user: UserAccount;

  @Column({
    type: 'varchar',
    length: 500,
    nullable: false,
  })
  token: string;

  @CreateDateColumn({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
    nullable: false,
  })
  created_at: Date;

  @Column({
    type: 'timestamp',
    nullable: false,
  })
  expires_at: Date;

  @DeleteDateColumn({
    type: 'timestamp',
    nullable: true,
  })
  deleted_at: Date;
}
