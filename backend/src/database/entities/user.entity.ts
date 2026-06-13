import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from './base.entity';
import { UserRole, UserStatus } from './enums';

@Entity('users')
export class User extends BaseEntity {
  @Column({ type: 'varchar', length: 50, unique: true, comment: '用户名' })
  username: string;

  @Column({ type: 'varchar', length: 255, comment: '密码哈希' })
  password_hash: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.STUDENT,
    comment: '角色: admin/teacher/student',
  })
  role: UserRole;

  @Column({
    type: 'enum',
    enum: UserStatus,
    default: UserStatus.ACTIVE,
    comment: '状态: active/inactive',
  })
  @Index()
  status: UserStatus;
}
