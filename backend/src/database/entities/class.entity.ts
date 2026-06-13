import { Entity, Column } from 'typeorm';
import { BaseEntity } from './base.entity';

@Entity('classes')
export class Class extends BaseEntity {
  @Column({ type: 'varchar', length: 100, comment: '班级名称' })
  name: string;

  @Column({ type: 'varchar', length: 50, comment: '年级' })
  grade: string;

  @Column({ type: 'varchar', length: 100, comment: '专业' })
  major: string;

  @Column({ type: 'int', comment: '学生人数' })
  student_count: number;

  @Column({ type: 'varchar', length: 100, nullable: true, comment: '所属部门' })
  department: string;
}
