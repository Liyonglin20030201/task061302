import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { StatisticsService } from './statistics.service';
import { Schedule } from '../../database/entities/schedule.entity';
import { CoursePlan } from '../../database/entities/course-plan.entity';
import { TrainingRoom } from '../../database/entities/training-room.entity';
import { Teacher } from '../../database/entities/teacher.entity';

describe('StatisticsService', () => {
  let service: StatisticsService;
  let mockQb: any;

  beforeEach(async () => {
    mockQb = {
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

    const mockManager = {
      count: jest.fn().mockImplementation((entity, opts?: any) => {
        if (entity === TrainingRoom) return Promise.resolve(5);
        if (entity === Teacher) return Promise.resolve(3);
        if (entity === CoursePlan) return Promise.resolve(opts?.where?.semester ? 2 : 5);
        return Promise.resolve(0);
      }),
      createQueryBuilder: jest.fn().mockReturnValue(mockQb),
    };

    const mockDataSource = {
      transaction: jest.fn().mockImplementation((_isolation: any, cb: any) => cb(mockManager)),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StatisticsService,
        { provide: getRepositoryToken(Schedule), useValue: {} },
        { provide: getRepositoryToken(CoursePlan), useValue: {} },
        { provide: getRepositoryToken(TrainingRoom), useValue: {} },
        { provide: getRepositoryToken(Teacher), useValue: {} },
        { provide: DataSource, useValue: mockDataSource },
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
      const result = await service.getOverview('2024-2025-1');
      expect(result.totalPlans).toBe(2);
    });
  });

  describe('getRoomUtilization', () => {
    it('should calculate utilization rate correctly', async () => {
      mockQb.getRawMany.mockResolvedValue([
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
      mockQb.getRawMany.mockResolvedValue([
        { teacherId: 't-1', teacherName: '张三', department: '计算机系', totalPeriods: '10', courseCount: '3' },
      ]);

      const result = await service.getTeacherWorkload();
      expect(result[0].weeklyHours).toBe(20);
      expect(result[0].courseCount).toBe(3);
    });
  });

  describe('getClassHours', () => {
    it('should return class hours with weekly calculation', async () => {
      mockQb.getRawMany.mockResolvedValue([
        { classId: 'c-1', className: '计算机2024-1班', major: '计算机科学', totalPeriods: '15' },
      ]);

      const result = await service.getClassHours();
      expect(result[0].weeklyHours).toBe(30);
      expect(result[0].totalPeriods).toBe(15);
    });
  });
});
