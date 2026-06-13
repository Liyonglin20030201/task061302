import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { StatisticsService } from './statistics.service';
import { Schedule } from '../../database/entities/schedule.entity';
import { CoursePlan } from '../../database/entities/course-plan.entity';
import { TrainingRoom } from '../../database/entities/training-room.entity';
import { Teacher } from '../../database/entities/teacher.entity';

describe('StatisticsService', () => {
  let service: StatisticsService;
  let mockScheduleRepo: any;
  let mockPlanRepo: any;
  let mockRoomRepo: any;
  let mockTeacherRepo: any;

  beforeEach(async () => {
    const mockQb = {
      leftJoin: jest.fn().mockReturnThis(),
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      groupBy: jest.fn().mockReturnThis(),
      addGroupBy: jest.fn().mockReturnThis(),
      getCount: jest.fn().mockResolvedValue(10),
      getRawMany: jest.fn().mockResolvedValue([]),
    };

    mockScheduleRepo = {
      createQueryBuilder: jest.fn().mockReturnValue(mockQb),
    };
    mockPlanRepo = { count: jest.fn().mockResolvedValue(5) };
    mockRoomRepo = { count: jest.fn().mockResolvedValue(5) };
    mockTeacherRepo = { count: jest.fn().mockResolvedValue(3) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StatisticsService,
        { provide: getRepositoryToken(Schedule), useValue: mockScheduleRepo },
        { provide: getRepositoryToken(CoursePlan), useValue: mockPlanRepo },
        { provide: getRepositoryToken(TrainingRoom), useValue: mockRoomRepo },
        { provide: getRepositoryToken(Teacher), useValue: mockTeacherRepo },
      ],
    }).compile();

    service = module.get<StatisticsService>(StatisticsService);
  });

  describe('getOverview', () => {
    it('should return summary counts', async () => {
      const result = await service.getOverview();
      expect(result).toEqual({
        totalRooms: 5,
        totalTeachers: 3,
        totalPlans: 5,
        totalSchedules: 10,
      });
    });

    it('should filter by semester when provided', async () => {
      mockPlanRepo.count.mockResolvedValue(2);
      const result = await service.getOverview('2024-2025-1');
      expect(mockPlanRepo.count).toHaveBeenCalledWith({ where: { semester: '2024-2025-1' } });
    });
  });

  describe('getRoomUtilization', () => {
    it('should calculate utilization rate correctly', async () => {
      const qb = mockScheduleRepo.createQueryBuilder();
      qb.getRawMany.mockResolvedValue([
        { roomId: 'room-1', roomName: 'Lab A', building: '实训楼', scheduledPeriods: '25' },
      ]);

      const result = await service.getRoomUtilization();
      expect(result[0].utilizationRate).toBe(50);
      expect(result[0].scheduledPeriods).toBe(25);
    });

    it('should return empty array when no schedules exist', async () => {
      const result = await service.getRoomUtilization();
      expect(result).toEqual([]);
    });
  });

  describe('getTeacherWorkload', () => {
    it('should return workload with weekly hours calculation', async () => {
      const qb = mockScheduleRepo.createQueryBuilder();
      qb.getRawMany.mockResolvedValue([
        { teacherId: 't-1', teacherName: '张三', department: '计算机系', totalPeriods: '10', courseCount: '3' },
      ]);

      const result = await service.getTeacherWorkload();
      expect(result[0].weeklyHours).toBe(20);
      expect(result[0].courseCount).toBe(3);
    });
  });

  describe('getClassHours', () => {
    it('should return class hours with weekly calculation', async () => {
      const qb = mockScheduleRepo.createQueryBuilder();
      qb.getRawMany.mockResolvedValue([
        { classId: 'c-1', className: '计算机2024-1班', major: '计算机科学', totalPeriods: '15' },
      ]);

      const result = await service.getClassHours();
      expect(result[0].weeklyHours).toBe(30);
      expect(result[0].totalPeriods).toBe(15);
    });
  });
});
