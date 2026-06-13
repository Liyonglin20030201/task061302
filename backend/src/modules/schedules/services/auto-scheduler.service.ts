import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CoursePlan } from '../../../database/entities/course-plan.entity';
import { TrainingRoom } from '../../../database/entities/training-room.entity';
import { TeacherAvailability } from '../../../database/entities/teacher-availability.entity';
import { Schedule } from '../../../database/entities/schedule.entity';
import { ScheduleHistory } from '../../../database/entities/schedule-history.entity';
import { ConflictDetectionService } from './conflict-detection.service';
import { PlanStatus, RoomStatus, ScheduleStatus } from '../../../database/entities/enums';

interface CandidateSlot {
  room: TrainingRoom;
  dayOfWeek: number;
  period: number;
  score: number;
}

export interface GenerateResult {
  scheduled: number;
  failed: { coursePlanId: string; reason: string }[];
  schedules: Schedule[];
}

@Injectable()
export class AutoSchedulerService {
  constructor(
    @InjectRepository(CoursePlan)
    private readonly planRepo: Repository<CoursePlan>,
    @InjectRepository(TrainingRoom)
    private readonly roomRepo: Repository<TrainingRoom>,
    @InjectRepository(TeacherAvailability)
    private readonly availabilityRepo: Repository<TeacherAvailability>,
    @InjectRepository(Schedule)
    private readonly scheduleRepo: Repository<Schedule>,
    @InjectRepository(ScheduleHistory)
    private readonly historyRepo: Repository<ScheduleHistory>,
    private readonly conflictService: ConflictDetectionService,
  ) {}

  async generate(semester: string, coursePlanIds?: string[], userId?: string): Promise<GenerateResult> {
    // 1. Load course plans
    let query = this.planRepo
      .createQueryBuilder('cp')
      .leftJoinAndSelect('cp.course', 'course')
      .leftJoinAndSelect('cp.teacher', 'teacher')
      .leftJoinAndSelect('cp.class', 'cls')
      .where('cp.semester = :semester', { semester })
      .andWhere('cp.status = :status', { status: PlanStatus.APPROVED });

    if (coursePlanIds && coursePlanIds.length > 0) {
      query = query.andWhere('cp.id IN (:...ids)', { ids: coursePlanIds });
    }

    const plans = await query.getMany();
    if (plans.length === 0) {
      throw new BadRequestException('No approved course plans found for this semester');
    }

    // 2. Load available rooms
    const rooms = await this.roomRepo.find({
      where: { status: RoomStatus.AVAILABLE },
    });

    // 3. Load teacher availability
    const teacherIds = [...new Set(plans.map(p => p.teacher.id))];
    const availabilities = await this.availabilityRepo
      .createQueryBuilder('ta')
      .where('ta.teacher_id IN (:...ids)', { ids: teacherIds })
      .andWhere('ta.is_available = true')
      .getMany();

    const teacherAvailMap = new Map<string, Set<string>>();
    for (const av of availabilities) {
      const key = av.teacher_id;
      if (!teacherAvailMap.has(key)) teacherAvailMap.set(key, new Set());
      teacherAvailMap.get(key)!.add(`${av.day_of_week}-${av.period}`);
    }

    // 4. Sort plans by constraint density (most constrained first)
    const sortedPlans = this.sortByConstraints(plans, rooms, teacherAvailMap);

    // 5. Track occupancy
    const roomOccupancy = new Map<string, Set<string>>(); // roomId -> Set<"day-period-week">
    const teacherOccupancy = new Map<string, Set<string>>();
    const classOccupancy = new Map<string, Set<string>>();

    // Load existing schedules for this semester to pre-populate occupancy
    const existingSchedules = await this.scheduleRepo
      .createQueryBuilder('s')
      .leftJoinAndSelect('s.coursePlan', 'cp')
      .leftJoinAndSelect('cp.teacher', 't')
      .leftJoinAndSelect('cp.class', 'c')
      .where('cp.semester = :semester', { semester })
      .andWhere('s.status = :status', { status: ScheduleStatus.ACTIVE })
      .getMany();

    for (const s of existingSchedules) {
      for (let w = s.week_start; w <= s.week_end; w++) {
        const slotKey = `${s.day_of_week}-${s.period}-${w}`;
        this.addToOccupancy(roomOccupancy, s.room_id, slotKey);
        this.addToOccupancy(teacherOccupancy, s.coursePlan?.teacher?.id, slotKey);
        this.addToOccupancy(classOccupancy, s.coursePlan?.class?.id, slotKey);
      }
    }

    // 6. Allocate each plan
    const result: GenerateResult = { scheduled: 0, failed: [], schedules: [] };
    const defaultWeekStart = 1;
    const defaultWeekEnd = 18;

    for (const plan of sortedPlans) {
      const sessionsPerWeek = Math.ceil(plan.planned_hours / (2 * (defaultWeekEnd - defaultWeekStart + 1)));
      const sessionsNeeded = Math.max(1, Math.min(sessionsPerWeek, 5));

      let scheduledCount = 0;
      for (let s = 0; s < sessionsNeeded; s++) {
        const candidates = this.findCandidateSlots(
          plan, rooms, teacherAvailMap, roomOccupancy, teacherOccupancy, classOccupancy,
          defaultWeekStart, defaultWeekEnd,
        );

        if (candidates.length === 0) {
          result.failed.push({
            coursePlanId: plan.id,
            reason: `No available slot for session ${s + 1}/${sessionsNeeded}`,
          });
          break;
        }

        // Pick best candidate
        const best = candidates.sort((a, b) => b.score - a.score)[0];

        // Create schedule
        const schedule = this.scheduleRepo.create({
          course_plan_id: plan.id,
          room_id: best.room.id,
          day_of_week: best.dayOfWeek,
          period: best.period,
          week_start: defaultWeekStart,
          week_end: defaultWeekEnd,
          status: ScheduleStatus.ACTIVE,
        });
        const saved = await this.scheduleRepo.save(schedule);

        // Record history
        await this.historyRepo.save(this.historyRepo.create({
          schedule_id: saved.id,
          action: 'created',
          changed_by: userId || undefined,
          changed_at: new Date(),
          snapshot_json: { ...saved, coursePlanId: plan.id, roomId: best.room.id },
        }));

        // Update occupancy
        for (let w = defaultWeekStart; w <= defaultWeekEnd; w++) {
          const slotKey = `${best.dayOfWeek}-${best.period}-${w}`;
          this.addToOccupancy(roomOccupancy, best.room.id, slotKey);
          this.addToOccupancy(teacherOccupancy, plan.teacher.id, slotKey);
          this.addToOccupancy(classOccupancy, plan.class?.id, slotKey);
        }

        result.schedules.push(saved);
        scheduledCount++;
      }

      if (scheduledCount > 0) {
        result.scheduled++;
        // Update plan status
        await this.planRepo.update(plan.id, { status: PlanStatus.SCHEDULED });
      }
    }

    return result;
  }

  private sortByConstraints(
    plans: CoursePlan[],
    rooms: TrainingRoom[],
    teacherAvailMap: Map<string, Set<string>>,
  ): CoursePlan[] {
    return plans.sort((a, b) => {
      // Fewer available teacher slots = more constrained
      const aSlots = teacherAvailMap.get(a.teacher.id)?.size || 0;
      const bSlots = teacherAvailMap.get(b.teacher.id)?.size || 0;

      // Larger class = harder to find room = more constrained
      const aConstraint = aSlots - ((a.class as any)?.student_count / 10 || 0);
      const bConstraint = bSlots - ((b.class as any)?.student_count / 10 || 0);

      return aConstraint - bConstraint;
    });
  }

  private findCandidateSlots(
    plan: CoursePlan,
    rooms: TrainingRoom[],
    teacherAvailMap: Map<string, Set<string>>,
    roomOccupancy: Map<string, Set<string>>,
    teacherOccupancy: Map<string, Set<string>>,
    classOccupancy: Map<string, Set<string>>,
    weekStart: number,
    weekEnd: number,
  ): CandidateSlot[] {
    const candidates: CandidateSlot[] = [];
    const teacherSlots = teacherAvailMap.get(plan.teacher.id) || new Set();

    // Filter suitable rooms
    const classStudentCount = (plan.class as any)?.student_count || 0;
    const courseType = plan.course?.course_type;
    const suitableRooms = rooms.filter(r =>
      r.capacity >= classStudentCount &&
      (!courseType || !r.equipment_type || r.equipment_type === courseType)
    );

    const classId = plan.class?.id;

    for (const room of suitableRooms) {
      for (let day = 1; day <= 5; day++) { // Monday to Friday
        for (let period = 1; period <= 10; period++) { // 10 periods per day
          // Check teacher availability
          if (!teacherSlots.has(`${day}-${period}`)) continue;

          // Check occupancy for all weeks
          let hasConflict = false;
          for (let w = weekStart; w <= weekEnd; w++) {
            const slotKey = `${day}-${period}-${w}`;
            if (roomOccupancy.get(room.id)?.has(slotKey) ||
                teacherOccupancy.get(plan.teacher.id)?.has(slotKey) ||
                (classId && classOccupancy.get(classId)?.has(slotKey))) {
              hasConflict = true;
              break;
            }
          }
          if (hasConflict) continue;

          // Score the slot
          const score = this.scoreSlot(day, period, plan, teacherOccupancy);
          candidates.push({ room, dayOfWeek: day, period, score });
        }
      }
    }

    return candidates;
  }

  private scoreSlot(
    day: number,
    period: number,
    plan: CoursePlan,
    teacherOccupancy: Map<string, Set<string>>,
  ): number {
    let score = 50;

    // Prefer morning slots (period 1-4)
    if (period <= 4) score += 10;
    // Slightly prefer mid-week
    if (day >= 2 && day <= 4) score += 5;
    // Penalize late afternoon
    if (period >= 9) score -= 10;

    // Prefer even distribution of teacher load across days
    const teacherSlots = teacherOccupancy.get(plan.teacher.id);
    if (teacherSlots) {
      const dayCount = [...teacherSlots].filter(s => s.startsWith(`${day}-`)).length;
      score -= dayCount * 3; // penalize days already heavily loaded
    }

    return score;
  }

  private addToOccupancy(map: Map<string, Set<string>>, id: string | undefined | null, key: string) {
    if (!id) return;
    if (!map.has(id)) map.set(id, new Set());
    map.get(id)!.add(key);
  }
}
