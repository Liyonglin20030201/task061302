import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
  VersionColumn,
  Index,
} from 'typeorm';
import { BaseEntity } from './base.entity';
import { CoursePlan } from './course-plan.entity';
import { TrainingRoom } from './training-room.entity';
import { ScheduleStatus } from './enums';

@Entity('schedules')
@Index('IDX_schedule_room_day_period', ['room_id', 'day_of_week', 'period'])
export class Schedule extends BaseEntity {
  @ManyToOne(() => CoursePlan, { eager: true })
  @JoinColumn({ name: 'course_plan_id' })
  coursePlan: CoursePlan;

  @Column({ type: 'uuid', name: 'course_plan_id', comment: '教学计划ID' })
  course_plan_id: string;

  @ManyToOne(() => TrainingRoom, { eager: true })
  @JoinColumn({ name: 'room_id' })
  room: TrainingRoom;

  @Column({ type: 'uuid', name: 'room_id', comment: '实训室ID' })
  room_id: string;

  @Column({ type: 'smallint', comment: '星期几 (1-7)' })
  day_of_week: number;

  @Column({ type: 'smallint', comment: '第几节课 (1-12)' })
  period: number;

  @Column({ type: 'smallint', comment: '开始周次' })
  week_start: number;

  @Column({ type: 'smallint', comment: '结束周次' })
  week_end: number;

  @VersionColumn({ comment: '乐观锁版本号' })
  version: number;

  @Column({
    type: 'enum',
    enum: ScheduleStatus,
    default: ScheduleStatus.ACTIVE,
    comment: '状态: active/cancelled',
  })
  status: ScheduleStatus;
}
