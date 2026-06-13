import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from './base.entity';
import { RoomStatus } from './enums';

@Entity('training_rooms')
export class TrainingRoom extends BaseEntity {
  @Column({ type: 'varchar', length: 100, comment: '实训室名称' })
  name: string;

  @Column({ type: 'varchar', length: 100, comment: '所在建筑' })
  building: string;

  @Column({ type: 'smallint', comment: '楼层' })
  floor: number;

  @Column({ type: 'int', comment: '容纳人数' })
  capacity: number;

  @Column({ type: 'varchar', length: 100, nullable: true, comment: '设备类型' })
  equipment_type: string;

  @Column({ type: 'int', default: 0, comment: '设备数量' })
  equipment_count: number;

  @Column({
    type: 'enum',
    enum: RoomStatus,
    default: RoomStatus.AVAILABLE,
    comment: '状态: available/maintenance/disabled',
  })
  @Index()
  status: RoomStatus;
}
