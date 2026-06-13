import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ScheduleChangesService } from './schedule-changes.service';
import { ScheduleChange } from '../../database/entities/schedule-change.entity';
import { Schedule } from '../../database/entities/schedule.entity';
import { ScheduleHistory } from '../../database/entities/schedule-history.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { ChangeStatus } from '../../database/entities/enums';

describe('ScheduleChangesService', () => {
  let service: ScheduleChangesService;
  let mockChangeRepo: any;
  let mockScheduleRepo: any;
  let mockHistoryRepo: any;
  let mockNotifService: any;
  let mockDataSource: any;

  beforeEach(async () => {
    mockChangeRepo = {
      findOne: jest.fn(),
      create: jest.fn().mockImplementation(dto => ({ ...dto, id: 'change-1' })),
      save: jest.fn().mockImplementation(entity => Promise.resolve(entity)),
      createQueryBuilder: jest.fn().mockReturnValue({
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
      }),
    };

    mockScheduleRepo = {
      findOne: jest.fn(),
      update: jest.fn().mockResolvedValue({ affected: 1 }),
    };

    mockHistoryRepo = {
      create: jest.fn().mockImplementation(dto => dto),
      save: jest.fn().mockResolvedValue({}),
    };

    mockNotifService = {
      send: jest.fn().mockResolvedValue({}),
    };

    mockDataSource = {
      transaction: jest.fn().mockImplementation(async (cb: any) => {
        const mockManager = {
          save: jest.fn().mockResolvedValue({}),
          update: jest.fn().mockResolvedValue({ affected: 1 }),
          getRepository: jest.fn().mockReturnValue({
            create: jest.fn().mockImplementation(dto => dto),
          }),
        };
        return cb(mockManager);
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ScheduleChangesService,
        { provide: getRepositoryToken(ScheduleChange), useValue: mockChangeRepo },
        { provide: getRepositoryToken(Schedule), useValue: mockScheduleRepo },
        { provide: getRepositoryToken(ScheduleHistory), useValue: mockHistoryRepo },
        { provide: NotificationsService, useValue: mockNotifService },
        { provide: DataSource, useValue: mockDataSource },
      ],
    }).compile();

    service = module.get<ScheduleChangesService>(ScheduleChangesService);
  });

  describe('create', () => {
    it('should snapshot original schedule state when creating change request', async () => {
      mockScheduleRepo.findOne.mockResolvedValue({
        id: 'schedule-1',
        room_id: 'room-1',
        day_of_week: 1,
        period: 1,
        week_start: 1,
        week_end: 18,
        coursePlan: { teacher: { id: 'teacher-1' } },
        room: { name: 'Lab A' },
      });

      const dto = { scheduleId: 'schedule-1', newDayOfWeek: 3, newPeriod: 5, reason: '时间冲突' };
      const result = await service.create(dto as any, 'user-1');

      expect(result.original_day_of_week).toBe(1);
      expect(result.original_period).toBe(1);
      expect(result.new_day_of_week).toBe(3);
      expect(result.new_period).toBe(5);
      expect(result.status).toBe(ChangeStatus.PENDING);
    });

    it('should throw NotFoundException for non-existent schedule', async () => {
      mockScheduleRepo.findOne.mockResolvedValue(null);
      const dto = { scheduleId: 'invalid', reason: 'test' };
      await expect(service.create(dto as any, 'user-1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('approve', () => {
    const mockChange = {
      id: 'change-1',
      schedule_id: 'schedule-1',
      requester_id: 'user-1',
      original_room_id: 'room-1',
      original_day_of_week: 1,
      original_period: 1,
      original_week_start: 1,
      original_week_end: 18,
      new_room_id: 'room-2',
      new_day_of_week: 3,
      new_period: 5,
      new_week_start: 1,
      new_week_end: 18,
      reason: '时间冲突',
      status: ChangeStatus.PENDING,
      schedule: { room_id: 'room-1', day_of_week: 1, period: 1, week_start: 1, week_end: 18, version: 1, course_plan_id: 'plan-1', coursePlan: { course: { name: 'Python' }, teacher: { name: '张三' } }, room: { name: 'Lab A' } },
      requester: { id: 'user-1' },
    };

    it('should execute approve within a transaction', async () => {
      mockChangeRepo.findOne.mockResolvedValue({ ...mockChange });

      await service.approve('change-1', 'admin-1');

      expect(mockDataSource.transaction).toHaveBeenCalled();
    });

    it('should send notification to requester on approval', async () => {
      mockChangeRepo.findOne.mockResolvedValue({ ...mockChange });

      await service.approve('change-1', 'admin-1');

      expect(mockNotifService.send).toHaveBeenCalledWith(
        'user-1',
        '调课申请已通过',
        expect.any(String),
        'approval',
      );
    });

    it('should reject already-processed change request', async () => {
      mockChangeRepo.findOne.mockResolvedValue({
        ...mockChange,
        status: ChangeStatus.APPROVED,
      });

      await expect(service.approve('change-1', 'admin-1')).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException for non-existent change', async () => {
      mockChangeRepo.findOne.mockResolvedValue(null);
      await expect(service.approve('invalid', 'admin-1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('reject', () => {
    it('should send rejection notification with reason', async () => {
      mockChangeRepo.findOne.mockResolvedValue({
        id: 'change-1',
        requester_id: 'user-1',
        status: ChangeStatus.PENDING,
        requester: { id: 'user-1' },
      });

      await service.reject('change-1', 'admin-1', '教室已被预留');

      expect(mockNotifService.send).toHaveBeenCalledWith(
        'user-1',
        '调课申请已拒绝',
        expect.stringContaining('教室已被预留'),
        'approval',
      );
    });

    it('should not modify the schedule on rejection', async () => {
      mockChangeRepo.findOne.mockResolvedValue({
        id: 'change-1',
        requester_id: 'user-1',
        status: ChangeStatus.PENDING,
        requester: { id: 'user-1' },
      });

      await service.reject('change-1', 'admin-1');
      expect(mockDataSource.transaction).not.toHaveBeenCalled();
    });
  });
});
