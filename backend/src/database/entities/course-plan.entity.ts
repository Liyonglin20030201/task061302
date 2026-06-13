import { Entity, Column, ManyToOne, JoinColumn, VersionColumn } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Course } from './course.entity';
import { Teacher } from './teacher.entity';
import { Class } from './class.entity';
import { PlanStatus } from './enums';

@Entity('course_plans')
export class CoursePlan extends BaseEntity {
  @Column({ type: 'varchar', length: 20, comment: '学期 (如: 2024-2025-1)' })
  semester: string;

  @ManyToOne(() => Course, { eager: true })
  @JoinColumn({ name: 'course_id' })
  course: Course;

  @Column({ type: 'uuid', name: 'course_id', comment: '课程ID' })
  course_id: string;

  @ManyToOne(() => Teacher, { eager: true })
  @JoinColumn({ name: 'teacher_id' })
  teacher: Teacher;

  @Column({ type: 'uuid', name: 'teacher_id', comment: '教师ID' })
  teacher_id: string;

  @ManyToOne(() => Class, { eager: true })
  @JoinColumn({ name: 'class_id' })
  class: Class;

  @Column({ type: 'uuid', name: 'class_id', comment: '班级ID' })
  class_id: string;

  @Column({ type: 'int', comment: '计划课时' })
  planned_hours: number;

  @Column({
    type: 'enum',
    enum: PlanStatus,
    default: PlanStatus.DRAFT,
    comment: '状态: draft/approved/scheduled',
  })
  status: PlanStatus;

  @VersionColumn({ comment: '乐观锁版本号' })
  version: number;
}
