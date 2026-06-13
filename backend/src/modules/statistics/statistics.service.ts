import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Schedule } from '../../database/entities/schedule.entity';
import { CoursePlan } from '../../database/entities/course-plan.entity';
import { TrainingRoom } from '../../database/entities/training-room.entity';
import { Teacher } from '../../database/entities/teacher.entity';
import { ScheduleStatus } from '../../database/entities/enums';

@Injectable()
export class StatisticsService {
  constructor(
    @InjectRepository(Schedule)
    private readonly scheduleRepo: Repository<Schedule>,
    @InjectRepository(CoursePlan)
    private readonly planRepo: Repository<CoursePlan>,
    @InjectRepository(TrainingRoom)
    private readonly roomRepo: Repository<TrainingRoom>,
    @InjectRepository(Teacher)
    private readonly teacherRepo: Repository<Teacher>,
    private readonly dataSource: DataSource,
  ) {}

  async getOverview(semester?: string) {
    return this.dataSource.transaction('REPEATABLE READ', async (manager) => {
      const totalRooms = await manager.count(TrainingRoom);
      const totalTeachers = await manager.count(Teacher);
      const totalPlans = semester
        ? await manager.count(CoursePlan, { where: { semester } })
        : await manager.count(CoursePlan);

      const scheduleQuery = manager.createQueryBuilder(Schedule, 's')
        .innerJoin('s.coursePlan', 'cp')
        .where('s.status = :status', { status: ScheduleStatus.ACTIVE });
      if (semester) scheduleQuery.andWhere('cp.semester = :semester', { semester });
      const totalSchedules = await scheduleQuery.getCount();

      return { totalRooms, totalTeachers, totalPlans, totalSchedules };
    });
  }

  async getRoomUtilization(semester?: string) {
    return this.dataSource.transaction('REPEATABLE READ', async (manager) => {
      const qb = manager.createQueryBuilder(Schedule, 's')
        .innerJoin('s.room', 'r')
        .innerJoin('s.coursePlan', 'cp')
        .select('r.id', 'roomId')
        .addSelect('r.name', 'roomName')
        .addSelect('r.building', 'building')
        .addSelect('COALESCE(COUNT(s.id), 0)', 'scheduledPeriods')
        .where('s.status = :status', { status: ScheduleStatus.ACTIVE })
        .andWhere('r.id IS NOT NULL')
        .groupBy('r.id')
        .addGroupBy('r.name')
        .addGroupBy('r.building');

      if (semester) qb.andWhere('cp.semester = :semester', { semester });

      const results = await qb.getRawMany();
      const totalPeriodsPerWeek = 50;

      return results.map(r => ({
        roomId: r.roomId,
        roomName: r.roomName,
        building: r.building,
        scheduledPeriods: parseInt(r.scheduledPeriods) || 0,
        utilizationRate: Math.round(((parseInt(r.scheduledPeriods) || 0) / totalPeriodsPerWeek) * 100 * 100) / 100,
      }));
    });
  }

  async getTeacherWorkload(semester?: string) {
    return this.dataSource.transaction('REPEATABLE READ', async (manager) => {
      const qb = manager.createQueryBuilder(Schedule, 's')
        .innerJoin('s.coursePlan', 'cp')
        .innerJoin('cp.teacher', 't')
        .select('t.id', 'teacherId')
        .addSelect('t.name', 'teacherName')
        .addSelect('t.department', 'department')
        .addSelect('COALESCE(COUNT(s.id), 0)', 'totalPeriods')
        .addSelect('COALESCE(COUNT(DISTINCT cp.id), 0)', 'courseCount')
        .where('s.status = :status', { status: ScheduleStatus.ACTIVE })
        .andWhere('t.id IS NOT NULL')
        .groupBy('t.id')
        .addGroupBy('t.name')
        .addGroupBy('t.department');

      if (semester) qb.andWhere('cp.semester = :semester', { semester });

      const results = await qb.getRawMany();
      return results.map(r => ({
        teacherId: r.teacherId,
        teacherName: r.teacherName,
        department: r.department,
        totalPeriods: parseInt(r.totalPeriods) || 0,
        courseCount: parseInt(r.courseCount) || 0,
        weeklyHours: (parseInt(r.totalPeriods) || 0) * 2,
      }));
    });
  }

  async getClassHours(semester?: string) {
    return this.dataSource.transaction('REPEATABLE READ', async (manager) => {
      const qb = manager.createQueryBuilder(Schedule, 's')
        .innerJoin('s.coursePlan', 'cp')
        .innerJoin('cp.class', 'c')
        .select('c.id', 'classId')
        .addSelect('c.name', 'className')
        .addSelect('c.major', 'major')
        .addSelect('COALESCE(COUNT(s.id), 0)', 'totalPeriods')
        .where('s.status = :status', { status: ScheduleStatus.ACTIVE })
        .andWhere('c.id IS NOT NULL')
        .groupBy('c.id')
        .addGroupBy('c.name')
        .addGroupBy('c.major');

      if (semester) qb.andWhere('cp.semester = :semester', { semester });

      const results = await qb.getRawMany();
      return results.map(r => ({
        classId: r.classId,
        className: r.className,
        major: r.major,
        totalPeriods: parseInt(r.totalPeriods) || 0,
        weeklyHours: (parseInt(r.totalPeriods) || 0) * 2,
      }));
    });
  }
}
