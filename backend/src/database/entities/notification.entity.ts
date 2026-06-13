import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { BaseEntity } from './base.entity';
import { User } from './user.entity';

@Entity('notifications')
@Index('IDX_notification_user_read', ['user_id', 'is_read'])
export class Notification extends BaseEntity {
  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'uuid', name: 'user_id', comment: '用户ID' })
  user_id: string;

  @Column({ type: 'varchar', length: 200, comment: '通知标题' })
  title: string;

  @Column({ type: 'text', comment: '通知内容' })
  content: string;

  @Column({ type: 'varchar', length: 50, comment: '通知类型' })
  type: string;

  @Column({ type: 'boolean', default: false, comment: '是否已读' })
  is_read: boolean;
}
