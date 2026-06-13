import { Entity, Column } from 'typeorm';
import { BaseEntity } from './base.entity';

@Entity('courses')
export class Course extends BaseEntity {
  @Column({ type: 'varchar', length: 100, comment: '课程名称' })
  name: string;

  @Column({ type: 'varchar', length: 50, unique: true, comment: '课程编号' })
  code: string;

  @Column({ type: 'int', comment: '课时数' })
  hours: number;

  @Column({ type: 'varchar', length: 50, nullable: true, comment: '课程类型' })
  course_type: string;

  @Column({ type: 'text', nullable: true, comment: '课程描述' })
  description: string;
}
