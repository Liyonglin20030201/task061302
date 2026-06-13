import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConflictDetectionService, ProposedSlot } from './conflict-detection.service';
import { Schedule } from '../../../database/entities/schedule.entity';

describe('ConflictDetectionService', () => {
  let service: ConflictDetectionService;
  let mockScheduleRepo: any;

  const mockSchedule = (overrides: any = {}) => ({
    id: 'schedule-1',
    room_id: 'room-1',
    room: { id: 'room-1', name: 'Lab A' },
    day_of_week: 1,
    period: 1,
    week_start: 1,
    week_end: 18,
    status: 'active',
    coursePlan: {
      teacher: { id: 'teacher-1', name: '张三' },
      class: { id: 'class-1', name: '计算机2024-1班' },
      course: { name: 'Python实训' },
    },
    ...overrides,
  });

  beforeEach(async () => {
    const mockQb = {
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue([]),
    };

    mockScheduleRepo = {
      createQueryBuilder: jest.fn().mockReturnValue(mockQb),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ConflictDetectionService,
        { provide: getRepositoryToken(Schedule), useValue: mockScheduleRepo },
      ],
    }).compile();

    service = module.get<ConflictDetectionService>(ConflictDetectionService);
  });

  it('should return empty array when no conflicts exist', async () => {
    const proposed: ProposedSlot = {
      roomId: 'room-1',
      teacherId: 'teacher-1',
      classId: 'class-1',
      dayOfWeek: 1,
      period: 1,
      weekStart: 1,
      weekEnd: 18,
    };

    const conflicts = await service.checkConflicts(proposed);
    expect(conflicts).toEqual([]);
  });

  it('should detect room conflict', async () => {
    const schedule = mockSchedule();
    const qb = mockScheduleRepo.createQueryBuilder();
    qb.getMany.mockResolvedValue([schedule]);

    const proposed: ProposedSlot = {
      roomId: 'room-1',
      teacherId: 'teacher-2',
      classId: 'class-2',
      dayOfWeek: 1,
      period: 1,
      weekStart: 1,
      weekEnd: 18,
    };

    const conflicts = await service.checkConflicts(proposed);
    expect(conflicts).toHaveLength(1);
    expect(conflicts[0].type).toBe('room');
  });

  it('should detect teacher conflict', async () => {
    const schedule = mockSchedule({ room: { id: 'room-2', name: 'Lab B' } });
    const qb = mockScheduleRepo.createQueryBuilder();
    qb.getMany.mockResolvedValue([schedule]);

    const proposed: ProposedSlot = {
      roomId: 'room-3',
      teacherId: 'teacher-1',
      classId: 'class-2',
      dayOfWeek: 1,
      period: 1,
      weekStart: 1,
      weekEnd: 18,
    };

    const conflicts = await service.checkConflicts(proposed);
    expect(conflicts).toHaveLength(1);
    expect(conflicts[0].type).toBe('teacher');
  });

  it('should detect class conflict', async () => {
    const schedule = mockSchedule({
      room: { id: 'room-2', name: 'Lab B' },
      coursePlan: {
        teacher: { id: 'teacher-2', name: '李四' },
        class: { id: 'class-1', name: '计算机2024-1班' },
        course: { name: '数据库实训' },
      },
    });
    const qb = mockScheduleRepo.createQueryBuilder();
    qb.getMany.mockResolvedValue([schedule]);

    const proposed: ProposedSlot = {
      roomId: 'room-3',
      teacherId: 'teacher-3',
      classId: 'class-1',
      dayOfWeek: 1,
      period: 1,
      weekStart: 1,
      weekEnd: 18,
    };

    const conflicts = await service.checkConflicts(proposed);
    expect(conflicts).toHaveLength(1);
    expect(conflicts[0].type).toBe('class');
  });

  it('should detect multiple conflicts simultaneously', async () => {
    const schedule = mockSchedule();
    const qb = mockScheduleRepo.createQueryBuilder();
    qb.getMany.mockResolvedValue([schedule]);

    const proposed: ProposedSlot = {
      roomId: 'room-1',
      teacherId: 'teacher-1',
      classId: 'class-1',
      dayOfWeek: 1,
      period: 1,
      weekStart: 1,
      weekEnd: 18,
    };

    const conflicts = await service.checkConflicts(proposed);
    expect(conflicts).toHaveLength(3);
    expect(conflicts.map(c => c.type).sort()).toEqual(['class', 'room', 'teacher']);
  });

  it('should exclude specified schedule from conflict check', async () => {
    const qb = mockScheduleRepo.createQueryBuilder();
    const proposed: ProposedSlot = {
      roomId: 'room-1',
      teacherId: 'teacher-1',
      classId: 'class-1',
      dayOfWeek: 1,
      period: 1,
      weekStart: 1,
      weekEnd: 18,
      excludeScheduleId: 'schedule-1',
    };

    await service.checkConflicts(proposed);
    expect(qb.andWhere).toHaveBeenCalledWith('s.id != :excludeId', { excludeId: 'schedule-1' });
  });

  it('should consider week overlap when detecting conflicts', async () => {
    const qb = mockScheduleRepo.createQueryBuilder();
    const proposed: ProposedSlot = {
      roomId: 'room-1',
      teacherId: 'teacher-1',
      classId: 'class-1',
      dayOfWeek: 1,
      period: 1,
      weekStart: 5,
      weekEnd: 10,
    };

    await service.checkConflicts(proposed);
    expect(qb.andWhere).toHaveBeenCalledWith(
      's.week_start <= :weekEnd AND s.week_end >= :weekStart',
      { weekStart: 5, weekEnd: 10 },
    );
  });
});
