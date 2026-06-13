import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
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
  ) {}

  async getOverview(semester?: string) {
    const totalRooms = await this.roomRepo.count();
    const totalTeachers = await this.teacherRepo.count();
    const totalPlans = semester
      ? await this.planRepo.count({ where: { semester } })
      : await this.planRepo.count();

    const scheduleQuery = this.scheduleRepo.createQueryBuilder('s')
      .leftJoin('s.coursePlan', 'cp')
      .where('s.status = :status', { status: ScheduleStatus.ACTIVE });
    if (semester) scheduleQuery.andWhere('cp.semester = :semester', { semester });
    const totalSchedules = await scheduleQuery.getCount();

    return { totalRooms, totalTeachers, totalPlans, totalSchedules };
  }

  async getRoomUtilization(semester?: string) {
    const qb = this.scheduleRepo.createQueryBuilder('s')
      .leftJoin('s.room', 'r')
      .leftJoin('s.coursePlan', 'cp')
      .select('r.id', 'roomId')
      .addSelect('r.name', 'roomName')
      .addSelect('r.building', 'building')
      .addSelect('COUNT(s.id)', 'scheduledPeriods')
      .where('s.status = :status', { status: ScheduleStatus.ACTIVE })
      .groupBy('r.id')
      .addGroupBy('r.name')
      .addGroupBy('r.building');

    if (semester) qb.andWhere('cp.semester = :semester', { semester });

    const results = await qb.getRawMany();
    const totalPeriodsPerWeek = 50; // 5 days * 10 periods

    return results.map(r => ({
      roomId: r.roomId,
      roomName: r.roomName,
      building: r.building,
      scheduledPeriods: parseInt(r.scheduledPeriods),
      utilizationRate: Math.round((parseInt(r.scheduledPeriods) / totalPeriodsPerWeek) * 100 * 100) / 100,
    }));
  }

  async getTeacherWorkload(semester?: string) {
    const qb = this.scheduleRepo.createQueryBuilder('s')
      .leftJoin('s.coursePlan', 'cp')
      .leftJoin('cp.teacher', 't')
      .select('t.id', 'teacherId')
      .addSelect('t.name', 'teacherName')
      .addSelect('t.department', 'department')
      .addSelect('COUNT(s.id)', 'totalPeriods')
      .addSelect('COUNT(DISTINCT cp.id)', 'courseCount')
      .where('s.status = :status', { status: ScheduleStatus.ACTIVE })
      .groupBy('t.id')
      .addGroupBy('t.name')
      .addGroupBy('t.department');

    if (semester) qb.andWhere('cp.semester = :semester', { semester });

    const results = await qb.getRawMany();
    return results.map(r => ({
      teacherId: r.teacherId,
      teacherName: r.teacherName,
      department: r.department,
      totalPeriods: parseInt(r.totalPeriods),
      courseCount: parseInt(r.courseCount),
      weeklyHours: parseInt(r.totalPeriods) * 2,
    }));
  }

  async getClassHours(semester?: string) {
    const qb = this.scheduleRepo.createQueryBuilder('s')
      .leftJoin('s.coursePlan', 'cp')
      .leftJoin('cp.classEntity', 'c')
      .leftJoin('cp.course', 'course')
      .select('c.id', 'classId')
      .addSelect('c.name', 'className')
      .addSelect('c.major', 'major')
      .addSelect('COUNT(s.id)', 'totalPeriods')
      .where('s.status = :status', { status: ScheduleStatus.ACTIVE })
      .groupBy('c.id')
      .addGroupBy('c.name')
      .addGroupBy('c.major');

    if (semester) qb.andWhere('cp.semester = :semester', { semester });

    const results = await qb.getRawMany();
    return results.map(r => ({
      classId: r.classId,
      className: r.className,
      major: r.major,
      totalPeriods: parseInt(r.totalPeriods),
      weeklyHours: parseInt(r.totalPeriods) * 2,
    }));
  }
}
