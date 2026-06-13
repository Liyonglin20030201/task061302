import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { SchedulesService } from './schedules.service';
import { Schedule } from '../../database/entities/schedule.entity';
import { ScheduleHistory } from '../../database/entities/schedule-history.entity';
import { ConflictDetectionService } from './services/conflict-detection.service';

describe('SchedulesService', () => {
  let service: SchedulesService;
  let mockScheduleRepo: any;
  let mockHistoryRepo: any;

  beforeEach(async () => {
    const mockQb = {
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      addOrderBy: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      set: jest.fn().mockReturnThis(),
      execute: jest.fn().mockResolvedValue({ affected: 1 }),
      getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
      getMany: jest.fn().mockResolvedValue([]),
    };

    mockScheduleRepo = {
      createQueryBuilder: jest.fn().mockReturnValue(mockQb),
      findOne: jest.fn(),
      create: jest.fn().mockImplementation(dto => ({ ...dto, id: 'new-schedule-id' })),
      save: jest.fn().mockImplementation(entity => Promise.resolve({ ...entity, id: entity.id || 'new-schedule-id' })),
    };

    mockHistoryRepo = {
      create: jest.fn().mockImplementation(dto => dto),
      save: jest.fn().mockResolvedValue({}),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SchedulesService,
        { provide: getRepositoryToken(Schedule), useValue: mockScheduleRepo },
        { provide: getRepositoryToken(ScheduleHistory), useValue: mockHistoryRepo },
        { provide: ConflictDetectionService, useValue: { checkConflicts: jest.fn().mockResolvedValue([]) } },
      ],
    }).compile();

    service = module.get<SchedulesService>(SchedulesService);
  });

  describe('update with optimistic locking', () => {
    it('should throw ConflictException with current data when version mismatch', async () => {
      const qb = mockScheduleRepo.createQueryBuilder();
      qb.execute.mockResolvedValue({ affected: 0 });
      mockScheduleRepo.findOne.mockResolvedValue({
        id: 'schedule-1',
        period: 2,
        version: 3,
        coursePlan: { course: {}, teacher: {}, class: {} },
        room: {},
      });

      await expect(
        service.update('schedule-1', { version: 1, period: 3 }, 'user-1'),
      ).rejects.toThrow(ConflictException);
    });

    it('should update schedule when version matches', async () => {
      const qb = mockScheduleRepo.createQueryBuilder();
      qb.execute.mockResolvedValue({ affected: 1 });
      mockScheduleRepo.findOne.mockResolvedValue({
        id: 'schedule-1',
        period: 3,
        version: 2,
        coursePlan: { course: {}, teacher: {}, class: {} },
        room: {},
      });

      const result = await service.update('schedule-1', { version: 1, period: 3 }, 'user-1');
      expect(result).toBeDefined();
      expect(mockHistoryRepo.save).toHaveBeenCalled();
    });

    it('should record history on successful update', async () => {
      const qb = mockScheduleRepo.createQueryBuilder();
      qb.execute.mockResolvedValue({ affected: 1 });
      mockScheduleRepo.findOne.mockResolvedValue({
        id: 'schedule-1',
        period: 3,
        version: 2,
        coursePlan: { course: {}, teacher: {}, class: {} },
        room: {},
      });

      await service.update('schedule-1', { version: 1, period: 3 }, 'user-1');
      expect(mockHistoryRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          schedule_id: 'schedule-1',
          action: 'updated',
          changed_by: 'user-1',
        }),
      );
    });
  });

  describe('remove', () => {
    it('should set status to cancelled instead of deleting', async () => {
      mockScheduleRepo.findOne.mockResolvedValue({
        id: 'schedule-1',
        status: 'active',
        coursePlan: { course: {}, teacher: {}, class: {} },
        room: {},
      });

      await service.remove('schedule-1', 'user-1');
      expect(mockScheduleRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'cancelled' }),
      );
      expect(mockHistoryRepo.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException for non-existent schedule', async () => {
      mockScheduleRepo.findOne.mockResolvedValue(null);
      await expect(service.remove('invalid-id', 'user-1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('should create schedule and record history', async () => {
      mockScheduleRepo.findOne.mockResolvedValue({
        id: 'new-schedule-id',
        course_plan_id: 'plan-1',
        room_id: 'room-1',
        day_of_week: 1,
        period: 1,
        coursePlan: { course: {}, teacher: {}, class: {} },
        room: {},
      });

      const dto = {
        coursePlanId: 'plan-1',
        roomId: 'room-1',
        dayOfWeek: 1,
        period: 1,
        weekStart: 1,
        weekEnd: 18,
      };

      const result = await service.create(dto, 'user-1');
      expect(result).toBeDefined();
      expect(mockHistoryRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'created' }),
      );
    });
  });
});
