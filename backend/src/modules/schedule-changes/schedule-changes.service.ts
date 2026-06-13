import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { ScheduleChange } from '../../database/entities/schedule-change.entity';
import { Schedule } from '../../database/entities/schedule.entity';
import { ScheduleHistory } from '../../database/entities/schedule-history.entity';
import { ChangeStatus, ScheduleStatus } from '../../database/entities/enums';
import { NotificationsService } from '../notifications/notifications.service';
import { PaginationDto, PaginatedResult } from '../../common/dto/pagination.dto';
import { CreateScheduleChangeDto } from './dto/create-schedule-change.dto';

@Injectable()
export class ScheduleChangesService {
  constructor(
    @InjectRepository(ScheduleChange)
    private readonly changeRepo: Repository<ScheduleChange>,
    @InjectRepository(Schedule)
    private readonly scheduleRepo: Repository<Schedule>,
    @InjectRepository(ScheduleHistory)
    private readonly historyRepo: Repository<ScheduleHistory>,
    private readonly notificationsService: NotificationsService,
    private readonly dataSource: DataSource,
  ) {}

  async create(dto: CreateScheduleChangeDto, requesterId: string): Promise<ScheduleChange> {
    const schedule = await this.scheduleRepo.findOne({
      where: { id: dto.scheduleId },
      relations: ['coursePlan', 'coursePlan.teacher', 'room'],
    });
    if (!schedule) throw new NotFoundException('Schedule not found');

    const change = this.changeRepo.create({
      schedule_id: dto.scheduleId,
      requester_id: requesterId,
      original_room_id: schedule.room_id,
      original_day_of_week: schedule.day_of_week,
      original_period: schedule.period,
      original_week_start: schedule.week_start,
      original_week_end: schedule.week_end,
      new_room_id: dto.newRoomId || schedule.room_id,
      new_day_of_week: dto.newDayOfWeek ?? schedule.day_of_week,
      new_period: dto.newPeriod ?? schedule.period,
      new_week_start: dto.newWeekStart ?? schedule.week_start,
      new_week_end: dto.newWeekEnd ?? schedule.week_end,
      reason: dto.reason,
      status: ChangeStatus.PENDING,
    });

    return this.changeRepo.save(change);
  }

  async findAll(pagination: PaginationDto, filters: { status?: string; requesterId?: string }): Promise<PaginatedResult<ScheduleChange>> {
    const page = pagination.page || 1;
    const limit = pagination.limit || 20;
    const qb = this.changeRepo.createQueryBuilder('sc')
      .leftJoinAndSelect('sc.schedule', 's')
      .leftJoinAndSelect('s.coursePlan', 'cp')
      .leftJoinAndSelect('cp.course', 'course')
      .leftJoinAndSelect('cp.teacher', 'teacher')
      .leftJoinAndSelect('sc.requester', 'requester')
      .leftJoinAndSelect('sc.approver', 'approver');

    if (filters.status) qb.andWhere('sc.status = :status', { status: filters.status });
    if (filters.requesterId) qb.andWhere('sc.requester_id = :rid', { rid: filters.requesterId });

    const [data, total] = await qb
      .orderBy('sc.created_at', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async approve(id: string, approverId: string): Promise<ScheduleChange> {
    const change = await this.changeRepo.findOne({
      where: { id },
      relations: ['schedule', 'schedule.coursePlan', 'schedule.coursePlan.teacher', 'schedule.coursePlan.course', 'schedule.room', 'requester'],
    });
    if (!change) throw new NotFoundException('Schedule change request not found');
    if (change.status !== ChangeStatus.PENDING) {
      throw new BadRequestException('This request has already been processed');
    }

    await this.dataSource.transaction(async (manager) => {
      // Re-read schedule inside transaction for consistent version
      const schedule = await manager.findOne(Schedule, {
        where: { id: change.schedule_id },
        relations: ['coursePlan', 'coursePlan.course', 'coursePlan.teacher', 'coursePlan.class', 'room'],
      });
      if (!schedule) throw new NotFoundException('Schedule not found in transaction');

      const versionAtChange = schedule.version;

      // Archive full self-contained before-state (no cross-references)
      await manager.save(ScheduleHistory, manager.getRepository(ScheduleHistory).create({
        schedule_id: change.schedule_id,
        action: 'change_approved',
        changed_by: approverId,
        changed_at: new Date(),
        schedule_version: versionAtChange,
        snapshot_json: {
          change_request_id: change.id,
          reason: change.reason,
          approver_id: approverId,
          before: {
            room_id: schedule.room_id,
            room_name: schedule.room?.name,
            day_of_week: schedule.day_of_week,
            period: schedule.period,
            week_start: schedule.week_start,
            week_end: schedule.week_end,
            version: versionAtChange,
            course_plan_id: schedule.course_plan_id,
            course_name: schedule.coursePlan?.course?.name,
            teacher_name: schedule.coursePlan?.teacher?.name,
            class_name: schedule.coursePlan?.class?.name,
            status: schedule.status,
          },
          after: {
            room_id: change.new_room_id,
            day_of_week: change.new_day_of_week,
            period: change.new_period,
            week_start: change.new_week_start,
            week_end: change.new_week_end,
            version: versionAtChange + 1,
          },
        },
      }));

      // Update the schedule (keep original record, update fields)
      await manager.update(Schedule, change.schedule_id, {
        room_id: change.new_room_id,
        day_of_week: change.new_day_of_week,
        period: change.new_period,
        week_start: change.new_week_start,
        week_end: change.new_week_end,
      });

      // Update change status
      change.status = ChangeStatus.APPROVED;
      change.approver_id = approverId;
      change.approved_at = new Date();
      await manager.save(ScheduleChange, change);
    });

    // Notify requester (outside transaction - non-critical)
    await this.notificationsService.send(
      change.requester_id,
      '调课申请已通过',
      `您的调课申请已通过审批。原因: ${change.reason}`,
      'approval',
    );

    return change;
  }

  async reject(id: string, approverId: string, rejectReason?: string): Promise<ScheduleChange> {
    const change = await this.changeRepo.findOne({
      where: { id },
      relations: ['requester'],
    });
    if (!change) throw new NotFoundException('Schedule change request not found');
    if (change.status !== ChangeStatus.PENDING) {
      throw new BadRequestException('This request has already been processed');
    }

    change.status = ChangeStatus.REJECTED;
    change.approver_id = approverId;
    change.approved_at = new Date();
    const saved = await this.changeRepo.save(change);

    await this.notificationsService.send(
      change.requester_id,
      '调课申请已拒绝',
      `您的调课申请被拒绝。${rejectReason ? '原因: ' + rejectReason : ''}`,
      'approval',
    );

    return saved;
  }
}
