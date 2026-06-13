import {
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export abstract class BaseEntity {
  @PrimaryGeneratedColumn('uuid', { comment: '主键ID' })
  id: string;

  @CreateDateColumn({ name: 'created_at', comment: '创建时间' })
  created_at: Date;

  @UpdateDateColumn({ name: 'updated_at', comment: '更新时间' })
  updated_at: Date;
}
