import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CoursePlan } from '../../database/entities/course-plan.entity';
import { CreateCoursePlanDto } from './dto/create-course-plan.dto';
import { UpdateCoursePlanDto } from './dto/update-course-plan.dto';
import { PaginationDto, PaginatedResult } from '../../common/dto/pagination.dto';

@Injectable()
export class CoursePlansService {
  constructor(
    @InjectRepository(CoursePlan)
    private readonly coursePlanRepository: Repository<CoursePlan>,
  ) {}

  async create(dto: CreateCoursePlanDto): Promise<CoursePlan> {
    const plan = this.coursePlanRepository.create({
      semester: dto.semester,
      course_id: dto.courseId,
      teacher_id: dto.teacherId,
      class_id: dto.classId,
      planned_hours: dto.plannedHours,
    });
    return this.coursePlanRepository.save(plan);
  }

  async createBatch(dtos: CreateCoursePlanDto[]): Promise<CoursePlan[]> {
    const plans = dtos.map((dto) =>
      this.coursePlanRepository.create({
        semester: dto.semester,
        course_id: dto.courseId,
        teacher_id: dto.teacherId,
        class_id: dto.classId,
        planned_hours: dto.plannedHours,
      }),
    );
    return this.coursePlanRepository.save(plans);
  }

  async findAll(
    pagination: PaginationDto,
    semester?: string,
  ): Promise<PaginatedResult<CoursePlan>> {
    const page = pagination.page || 1;
    const limit = pagination.limit || 20;
    const qb = this.coursePlanRepository.createQueryBuilder('plan')
      .leftJoinAndSelect('plan.course', 'course')
      .leftJoinAndSelect('plan.teacher', 'teacher')
      .leftJoinAndSelect('plan.class', 'class');

    if (semester) {
      qb.where('plan.semester = :semester', { semester });
    }

    qb.orderBy('plan.created_at', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [data, total] = await qb.getManyAndCount();
    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string): Promise<CoursePlan> {
    const plan = await this.coursePlanRepository.findOne({
      where: { id },
      relations: ['course', 'teacher', 'class'],
    });
    if (!plan) {
      throw new NotFoundException(`CoursePlan with id ${id} not found`);
    }
    return plan;
  }

  async update(id: string, dto: UpdateCoursePlanDto): Promise<CoursePlan> {
    const plan = await this.findOne(id);
    if (dto.semester !== undefined) plan.semester = dto.semester;
    if (dto.courseId !== undefined) plan.course_id = dto.courseId;
    if (dto.teacherId !== undefined) plan.teacher_id = dto.teacherId;
    if (dto.classId !== undefined) plan.class_id = dto.classId;
    if (dto.plannedHours !== undefined) plan.planned_hours = dto.plannedHours;
    return this.coursePlanRepository.save(plan);
  }

  async remove(id: string): Promise<void> {
    const plan = await this.findOne(id);
    await this.coursePlanRepository.remove(plan);
  }
}
