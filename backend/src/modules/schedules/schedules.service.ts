import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Schedule } from '../../database/entities/schedule.entity';
import { ScheduleHistory } from '../../database/entities/schedule-history.entity';
import { ScheduleStatus } from '../../database/entities/enums';
import { PaginationDto, PaginatedResult } from '../../common/dto/pagination.dto';
import { CreateScheduleDto } from './dto/create-schedule.dto';
import { UpdateScheduleDto } from './dto/update-schedule.dto';
import { ConflictDetectionService } from './services/conflict-detection.service';

@Injectable()
export class SchedulesService {
  constructor(
    @InjectRepository(Schedule)
    private readonly scheduleRepo: Repository<Schedule>,
    @InjectRepository(ScheduleHistory)
    private readonly historyRepo: Repository<ScheduleHistory>,
    private readonly conflictDetection: ConflictDetectionService,
  ) {}

  async findAll(
    pagination: PaginationDto,
    filters: { semester?: string; teacherId?: string; classId?: string; roomId?: string },
  ): Promise<PaginatedResult<Schedule>> {
    const { page = 1, limit = 20 } = pagination;
    const qb = this.scheduleRepo
      .createQueryBuilder('s')
      .leftJoinAndSelect('s.coursePlan', 'cp')
      .leftJoinAndSelect('cp.course', 'course')
      .leftJoinAndSelect('cp.teacher', 'teacher')
      .leftJoinAndSelect('cp.class', 'cls')
      .leftJoinAndSelect('s.room', 'room')
      .where('s.status = :status', { status: ScheduleStatus.ACTIVE });

    if (filters.semester) {
      qb.andWhere('cp.semester = :semester', { semester: filters.semester });
    }
    if (filters.teacherId) {
      qb.andWhere('teacher.id = :teacherId', { teacherId: filters.teacherId });
    }
    if (filters.classId) {
      qb.andWhere('cls.id = :classId', { classId: filters.classId });
    }
    if (filters.roomId) {
      qb.andWhere('room.id = :roomId', { roomId: filters.roomId });
    }

    const [data, total] = await qb
      .orderBy('s.day_of_week', 'ASC')
      .addOrderBy('s.period', 'ASC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOne(id: string): Promise<Schedule> {
    const schedule = await this.scheduleRepo.findOne({
      where: { id },
      relations: ['coursePlan', 'coursePlan.course', 'coursePlan.teacher', 'coursePlan.class', 'room'],
    });
    if (!schedule) throw new NotFoundException('Schedule not found');
    return schedule;
  }

  async create(dto: CreateScheduleDto, userId: string): Promise<Schedule> {
    const schedule = this.scheduleRepo.create({
      course_plan_id: dto.coursePlanId,
      room_id: dto.roomId,
      day_of_week: dto.dayOfWeek,
      period: dto.period,
      week_start: dto.weekStart,
      week_end: dto.weekEnd,
      status: ScheduleStatus.ACTIVE,
    });

    const saved = await this.scheduleRepo.save(schedule);

    await this.historyRepo.save(
      this.historyRepo.create({
        schedule_id: saved.id,
        action: 'created',
        changed_by: userId,
        changed_at: new Date(),
        snapshot_json: { ...dto, id: saved.id },
      }),
    );

    return this.findOne(saved.id);
  }

  async update(id: string, dto: UpdateScheduleDto, userId: string): Promise<Schedule> {
    const { version, roomId, dayOfWeek, weekStart, weekEnd, ...rest } = dto;

    // Build update payload mapping DTO fields to entity columns
    const updateData: Record<string, any> = { ...rest };
    if (roomId !== undefined) updateData.room_id = roomId;
    if (dayOfWeek !== undefined) updateData.day_of_week = dayOfWeek;
    if (weekStart !== undefined) updateData.week_start = weekStart;
    if (weekEnd !== undefined) updateData.week_end = weekEnd;

    const result = await this.scheduleRepo
      .createQueryBuilder()
      .update(Schedule)
      .set(updateData)
      .where('id = :id AND version = :version', { id, version })
      .execute();

    if (result.affected === 0) {
      throw new ConflictException(
        'Schedule was modified by another user. Please reload and try again.',
      );
    }

    const updated = await this.findOne(id);

    await this.historyRepo.save(
      this.historyRepo.create({
        schedule_id: updated.id,
        action: 'updated',
        changed_by: userId,
        changed_at: new Date(),
        snapshot_json: { ...updated },
      }),
    );

    return updated;
  }

  async remove(id: string, userId: string): Promise<void> {
    const schedule = await this.findOne(id);
    schedule.status = ScheduleStatus.CANCELLED;
    await this.scheduleRepo.save(schedule);

    await this.historyRepo.save(
      this.historyRepo.create({
        schedule_id: schedule.id,
        action: 'cancelled',
        changed_by: userId,
        changed_at: new Date(),
        snapshot_json: { ...schedule },
      }),
    );
  }

  async findByRoom(roomId: string, weekStart: number, weekEnd: number): Promise<Schedule[]> {
    return this.scheduleRepo
      .createQueryBuilder('s')
      .leftJoinAndSelect('s.coursePlan', 'cp')
      .leftJoinAndSelect('cp.course', 'course')
      .leftJoinAndSelect('cp.teacher', 'teacher')
      .where('s.room_id = :roomId', { roomId })
      .andWhere('s.status = :status', { status: ScheduleStatus.ACTIVE })
      .andWhere('s.week_start <= :weekEnd AND s.week_end >= :weekStart', { weekStart, weekEnd })
      .orderBy('s.day_of_week', 'ASC')
      .addOrderBy('s.period', 'ASC')
      .getMany();
  }

  async findByTeacher(teacherId: string, weekStart: number, weekEnd: number): Promise<Schedule[]> {
    return this.scheduleRepo
      .createQueryBuilder('s')
      .leftJoinAndSelect('s.coursePlan', 'cp')
      .leftJoinAndSelect('cp.course', 'course')
      .leftJoinAndSelect('cp.teacher', 'teacher')
      .leftJoinAndSelect('s.room', 'room')
      .where('cp.teacher_id = :teacherId', { teacherId })
      .andWhere('s.status = :status', { status: ScheduleStatus.ACTIVE })
      .andWhere('s.week_start <= :weekEnd AND s.week_end >= :weekStart', { weekStart, weekEnd })
      .orderBy('s.day_of_week', 'ASC')
      .addOrderBy('s.period', 'ASC')
      .getMany();
  }

  async findByClass(classId: string, weekStart: number, weekEnd: number): Promise<Schedule[]> {
    return this.scheduleRepo
      .createQueryBuilder('s')
      .leftJoinAndSelect('s.coursePlan', 'cp')
      .leftJoinAndSelect('cp.course', 'course')
      .leftJoinAndSelect('cp.class', 'cls')
      .leftJoinAndSelect('s.room', 'room')
      .where('cp.class_id = :classId', { classId })
      .andWhere('s.status = :status', { status: ScheduleStatus.ACTIVE })
      .andWhere('s.week_start <= :weekEnd AND s.week_end >= :weekStart', { weekStart, weekEnd })
      .orderBy('s.day_of_week', 'ASC')
      .addOrderBy('s.period', 'ASC')
      .getMany();
  }
}
