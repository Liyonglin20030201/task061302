import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConflictDetectionService } from '../src/modules/schedules/services/conflict-detection.service';
import { Schedule } from '../src/database/entities/schedule.entity';
import { ScheduleStatus } from '../src/database/entities/enums';

describe('ConflictDetectionService', () => {
  let service: ConflictDetectionService;
  let mockScheduleRepo: any;

  beforeEach(async () => {
    mockScheduleRepo = {
      createQueryBuilder: jest.fn().mockReturnThis(),
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getMany: jest.fn(),
    };

    const qb = {
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue([]),
    };
    mockScheduleRepo.createQueryBuilder.mockReturnValue(qb);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ConflictDetectionService,
        { provide: getRepositoryToken(Schedule), useValue: mockScheduleRepo },
      ],
    }).compile();

    service = module.get<ConflictDetectionService>(ConflictDetectionService);
  });

  it('should return empty array when no conflicts exist', async () => {
    const conflicts = await service.checkConflicts({
      roomId: 'room-1',
      teacherId: 'teacher-1',
      classId: 'class-1',
      dayOfWeek: 1,
      period: 1,
      weekStart: 1,
      weekEnd: 18,
    });
    expect(conflicts).toEqual([]);
  });

  it('should detect room conflict', async () => {
    const existingSchedule = {
      id: 'schedule-1',
      room: { id: 'room-1', name: 'Room A' },
      coursePlan: {
        course: { name: 'Course A' },
        teacher: { id: 'teacher-2', name: 'Teacher B' },
        classEntity: { id: 'class-2', name: 'Class B' },
      },
      dayOfWeek: 1,
      period: 1,
      weekStart: 1,
      weekEnd: 18,
      status: ScheduleStatus.ACTIVE,
    };

    const qb = {
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue([existingSchedule]),
    };
    mockScheduleRepo.createQueryBuilder.mockReturnValue(qb);

    const conflicts = await service.checkConflicts({
      roomId: 'room-1',
      teacherId: 'teacher-1',
      classId: 'class-1',
      dayOfWeek: 1,
      period: 1,
      weekStart: 1,
      weekEnd: 18,
    });

    expect(conflicts.length).toBe(1);
    expect(conflicts[0].type).toBe('room');
  });

  it('should detect teacher conflict', async () => {
    const existingSchedule = {
      id: 'schedule-1',
      room: { id: 'room-2', name: 'Room B' },
      coursePlan: {
        course: { name: 'Course B' },
        teacher: { id: 'teacher-1', name: 'Teacher A' },
        classEntity: { id: 'class-2', name: 'Class B' },
      },
      dayOfWeek: 1,
      period: 1,
      weekStart: 1,
      weekEnd: 18,
      status: ScheduleStatus.ACTIVE,
    };

    const qb = {
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue([existingSchedule]),
    };
    mockScheduleRepo.createQueryBuilder.mockReturnValue(qb);

    const conflicts = await service.checkConflicts({
      roomId: 'room-1',
      teacherId: 'teacher-1',
      classId: 'class-1',
      dayOfWeek: 1,
      period: 1,
      weekStart: 1,
      weekEnd: 18,
    });

    expect(conflicts.length).toBe(1);
    expect(conflicts[0].type).toBe('teacher');
  });

  it('should detect class conflict', async () => {
    const existingSchedule = {
      id: 'schedule-1',
      room: { id: 'room-2', name: 'Room B' },
      coursePlan: {
        course: { name: 'Course B' },
        teacher: { id: 'teacher-2', name: 'Teacher B' },
        classEntity: { id: 'class-1', name: 'Class A' },
      },
    };

    const qb = {
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue([existingSchedule]),
    };
    mockScheduleRepo.createQueryBuilder.mockReturnValue(qb);

    const conflicts = await service.checkConflicts({
      roomId: 'room-1',
      teacherId: 'teacher-1',
      classId: 'class-1',
      dayOfWeek: 1,
      period: 1,
      weekStart: 1,
      weekEnd: 18,
    });

    expect(conflicts.length).toBe(1);
    expect(conflicts[0].type).toBe('class');
  });

  it('should detect multiple conflicts simultaneously', async () => {
    const existingSchedules = [
      {
        id: 'schedule-1',
        room: { id: 'room-1', name: 'Room A' },
        coursePlan: { course: { name: 'C1' }, teacher: { id: 'teacher-1', name: 'T1' }, classEntity: { id: 'class-1', name: 'CL1' } },
      },
    ];

    const qb = {
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue(existingSchedules),
    };
    mockScheduleRepo.createQueryBuilder.mockReturnValue(qb);

    const conflicts = await service.checkConflicts({
      roomId: 'room-1',
      teacherId: 'teacher-1',
      classId: 'class-1',
      dayOfWeek: 1,
      period: 1,
      weekStart: 1,
      weekEnd: 18,
    });

    expect(conflicts.length).toBe(3);
    const types = conflicts.map(c => c.type);
    expect(types).toContain('room');
    expect(types).toContain('teacher');
    expect(types).toContain('class');
  });
});
