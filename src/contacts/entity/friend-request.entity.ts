import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  Column,
} from 'typeorm';
import { UserAccount } from '../../user/entity/user-account.entity';

@Entity()
export class FriendRequest {
  @PrimaryGeneratedColumn()
  request_id: number;

  @ManyToOne(() => UserAccount, (user) => user.sentFriendRequests, {
    nullable: false,
  })
  @JoinColumn({ name: 'sender_id' })
  sender: UserAccount;

  @ManyToOne(() => UserAccount, (user) => user.receivedFriendRequests, {
    nullable: false,
  })
  @JoinColumn({ name: 'receiver_id' })
  receiver: UserAccount;

  @Column({
    type: 'enum',
    enum: ['pending', 'accepted', 'rejected'],
    default: 'pending',
  })
  status: 'pending' | 'accepted' | 'rejected';

  @CreateDateColumn({
    type: 'timestamp',
  })
  created_at: Date;
}
