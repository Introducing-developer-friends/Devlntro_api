// src/entities/friend-request.entity.ts
import { Entity, PrimaryGeneratedColumn, ManyToOne, JoinColumn, CreateDateColumn, Column } from 'typeorm';
import { UserAccount } from './user-account.entity';

// FriendRequest 엔터티는 데이터베이스의 friend_request 테이블과 매핑.
@Entity()
export class FriendRequest {
  @PrimaryGeneratedColumn()
  request_id: number;

  @ManyToOne(() => UserAccount, user => user.sentFriendRequests)
  @JoinColumn({ name: 'sender_id' }) // 친구 요청을 보낸 사용자, user_account 테이블과 외래 키 관계
  sender: UserAccount;

  @ManyToOne(() => UserAccount, user => user.receivedFriendRequests)
  @JoinColumn({ name: 'receiver_id' }) // 친구 요청을 받은 사용자, user_account 테이블과 외래 키 관계
  receiver: UserAccount;

  @Column({
    type: 'enum',
    enum: ['pending', 'accepted', 'rejected'],
    default: 'pending'
  })
  status: 'pending' | 'accepted' | 'rejected'; // 요청 상태 (대기 중, 수락됨, 거절됨)


  @CreateDateColumn()
  created_at: Date; // 요청이 생성된 날짜와 시간을 자동으로 기록
}