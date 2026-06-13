import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { BaseEntity } from './base.entity';
import { User } from './user.entity';

@Entity('audit_logs')
@Index('IDX_audit_user_created', ['user_id', 'created_at'])
@Index('IDX_audit_resource', ['resource_type', 'resource_id'])
export class AuditLog extends BaseEntity {
  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'uuid', name: 'user_id', nullable: true, comment: '操作人ID' })
  user_id: string;

  @Column({ type: 'varchar', length: 100, comment: '操作类型' })
  action: string;

  @Column({ type: 'varchar', length: 100, comment: '资源类型' })
  resource_type: string;

  @Column({ type: 'varchar', length: 100, nullable: true, comment: '资源ID' })
  resource_id: string;

  @Column({ type: 'jsonb', nullable: true, comment: '详细信息' })
  details_json: Record<string, any>;

  @Column({ type: 'varchar', length: 50, nullable: true, comment: 'IP地址' })
  ip_address: string;
}
