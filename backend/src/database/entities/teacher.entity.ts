import {
  Entity,
  Column,
  OneToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { BaseEntity } from './base.entity';
import { User } from './user.entity';
import { TeacherAvailability } from './teacher-availability.entity';

@Entity('teachers')
export class Teacher extends BaseEntity {
  @OneToOne(() => User, { eager: true })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'uuid', name: 'user_id', comment: '关联用户ID' })
  user_id: string;

  @Column({ type: 'varchar', length: 50, comment: '教师姓名' })
  name: string;

  @Column({
    type: 'varchar',
    length: 50,
    unique: true,
    comment: '工号',
  })
  employee_no: string;

  @Column({ type: 'varchar', length: 50, nullable: true, comment: '职称' })
  title: string;

  @Column({ type: 'varchar', length: 100, nullable: true, comment: '部门' })
  department: string;

  @Column({ type: 'varchar', length: 20, nullable: true, comment: '联系电话' })
  phone: string;

  @Column({ type: 'varchar', length: 100, nullable: true, comment: '邮箱' })
  email: string;

  @Column({ type: 'jsonb', nullable: true, comment: '资质信息' })
  qualifications: Record<string, any>;

  @OneToMany(() => TeacherAvailability, (availability) => availability.teacher)
  availabilities: TeacherAvailability[];
}
