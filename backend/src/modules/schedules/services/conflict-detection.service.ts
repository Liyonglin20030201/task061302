import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Schedule } from '../../../database/entities/schedule.entity';
import { ScheduleStatus } from '../../../database/entities/enums';

export interface Conflict {
  type: 'room' | 'teacher' | 'class';
  scheduleId: string;
  description: string;
}

export interface ProposedSlot {
  roomId: string;
  teacherId: string;
  classId: string;
  dayOfWeek: number;
  period: number;
  weekStart: number;
  weekEnd: number;
  excludeScheduleId?: string;
}

@Injectable()
export class ConflictDetectionService {
  constructor(
    @InjectRepository(Schedule)
    private readonly scheduleRepo: Repository<Schedule>,
  ) {}

  async checkConflicts(proposed: ProposedSlot): Promise<Conflict[]> {
    const conflicts: Conflict[] = [];

    // Build base query for active schedules with overlapping weeks and same day/period
    const baseQuery = this.scheduleRepo
      .createQueryBuilder('s')
      .leftJoinAndSelect('s.coursePlan', 'cp')
      .leftJoinAndSelect('cp.teacher', 't')
      .leftJoinAndSelect('cp.class', 'c')
      .leftJoinAndSelect('s.room', 'r')
      .where('s.status = :status', { status: ScheduleStatus.ACTIVE })
      .andWhere('s.day_of_week = :day', { day: proposed.dayOfWeek })
      .andWhere('s.period = :period', { period: proposed.period })
      .andWhere('s.week_start <= :weekEnd AND s.week_end >= :weekStart', {
        weekStart: proposed.weekStart,
        weekEnd: proposed.weekEnd,
      });

    if (proposed.excludeScheduleId) {
      baseQuery.andWhere('s.id != :excludeId', { excludeId: proposed.excludeScheduleId });
    }

    const overlapping = await baseQuery.getMany();

    for (const schedule of overlapping) {
      // Room conflict
      if (schedule.room?.id === proposed.roomId) {
        conflicts.push({
          type: 'room',
          scheduleId: schedule.id,
          description: `Room ${schedule.room.name} is occupied by ${schedule.coursePlan?.course?.name || 'another course'}`,
        });
      }
      // Teacher conflict
      if (schedule.coursePlan?.teacher?.id === proposed.teacherId) {
        conflicts.push({
          type: 'teacher',
          scheduleId: schedule.id,
          description: `Teacher ${schedule.coursePlan.teacher.name} is teaching ${schedule.coursePlan?.course?.name || 'another course'}`,
        });
      }
      // Class conflict
      if (schedule.coursePlan?.class?.id === proposed.classId) {
        conflicts.push({
          type: 'class',
          scheduleId: schedule.id,
          description: `Class ${schedule.coursePlan.class.name} has ${schedule.coursePlan?.course?.name || 'another course'}`,
        });
      }
    }

    return conflicts;
  }
}
