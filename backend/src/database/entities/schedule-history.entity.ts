import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Schedule } from './schedule.entity';
import { User } from './user.entity';

@Entity('schedule_history')
export class ScheduleHistory extends BaseEntity {
  @ManyToOne(() => Schedule)
  @JoinColumn({ name: 'schedule_id' })
  schedule: Schedule;

  @Column({ type: 'uuid', name: 'schedule_id', comment: '排课ID' })
  schedule_id: string;

  @Column({ type: 'varchar', length: 50, comment: '操作类型' })
  action: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'changed_by' })
  changedBy: User;

  @Column({ type: 'uuid', name: 'changed_by', comment: '操作人ID' })
  changed_by: string;

  @Column({ type: 'timestamp', default: () => 'NOW()', comment: '变更时间' })
  changed_at: Date;

  @Column({ type: 'jsonb', nullable: true, comment: '快照数据' })
  snapshot_json: Record<string, any>;
}
