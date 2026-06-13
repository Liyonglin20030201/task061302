import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Schedule } from './schedule.entity';
import { User } from './user.entity';
import { ChangeStatus } from './enums';

@Entity('schedule_changes')
export class ScheduleChange extends BaseEntity {
  @ManyToOne(() => Schedule)
  @JoinColumn({ name: 'schedule_id' })
  schedule: Schedule;

  @Column({ type: 'uuid', name: 'schedule_id', comment: '排课ID' })
  schedule_id: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'requester_id' })
  requester: User;

  @Column({ type: 'uuid', name: 'requester_id', comment: '申请人ID' })
  requester_id: string;

  @Column({ type: 'uuid', nullable: true, comment: '原实训室ID' })
  original_room_id: string;

  @Column({ type: 'smallint', nullable: true, comment: '原星期几' })
  original_day_of_week: number;

  @Column({ type: 'smallint', nullable: true, comment: '原节次' })
  original_period: number;

  @Column({ type: 'smallint', nullable: true, comment: '原开始周次' })
  original_week_start: number;

  @Column({ type: 'smallint', nullable: true, comment: '原结束周次' })
  original_week_end: number;

  @Column({ type: 'uuid', nullable: true, comment: '新实训室ID' })
  new_room_id: string;

  @Column({ type: 'smallint', nullable: true, comment: '新星期几' })
  new_day_of_week: number;

  @Column({ type: 'smallint', nullable: true, comment: '新节次' })
  new_period: number;

  @Column({ type: 'smallint', nullable: true, comment: '新开始周次' })
  new_week_start: number;

  @Column({ type: 'smallint', nullable: true, comment: '新结束周次' })
  new_week_end: number;

  @Column({ type: 'text', nullable: true, comment: '变更原因' })
  reason: string;

  @Column({
    type: 'enum',
    enum: ChangeStatus,
    default: ChangeStatus.PENDING,
    comment: '状态: pending/approved/rejected',
  })
  status: ChangeStatus;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'approver_id' })
  approver: User;

  @Column({ type: 'uuid', name: 'approver_id', nullable: true, comment: '审批人ID' })
  approver_id: string;

  @Column({ type: 'timestamp', nullable: true, comment: '审批时间' })
  approved_at: Date;
}
