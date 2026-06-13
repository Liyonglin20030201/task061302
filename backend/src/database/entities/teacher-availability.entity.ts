import { Entity, Column, ManyToOne, JoinColumn, Unique } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Teacher } from './teacher.entity';

@Entity('teacher_availability')
@Unique('UQ_teacher_day_period', ['teacher_id', 'day_of_week', 'period'])
export class TeacherAvailability extends BaseEntity {
  @ManyToOne(() => Teacher, (teacher) => teacher.availabilities, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'teacher_id' })
  teacher: Teacher;

  @Column({ type: 'uuid', name: 'teacher_id', comment: '教师ID' })
  teacher_id: string;

  @Column({
    type: 'smallint',
    comment: '星期几 (1-7)',
  })
  day_of_week: number;

  @Column({
    type: 'smallint',
    comment: '第几节课 (1-12)',
  })
  period: number;

  @Column({
    type: 'boolean',
    default: true,
    comment: '是否可用',
  })
  is_available: boolean;
}
