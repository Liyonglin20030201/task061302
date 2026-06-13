import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from './base.entity';
import { User } from './user.entity';

@Entity('idempotency_keys')
export class IdempotencyKey extends BaseEntity {
  @Column({ type: 'varchar', length: 255, unique: true, comment: '幂等键' })
  key: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'uuid', name: 'user_id', comment: '用户ID' })
  user_id: string;

  @Column({ type: 'jsonb', nullable: true, comment: '响应JSON' })
  response_json: Record<string, any>;

  @Column({ type: 'timestamp', comment: '过期时间' })
  expires_at: Date;
}
