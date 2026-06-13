import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
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
    const { version, ...fields } = dto;

    const updateData: Record<string, any> = {};
    if (fields.semester !== undefined) updateData.semester = fields.semester;
    if (fields.courseId !== undefined) updateData.course_id = fields.courseId;
    if (fields.teacherId !== undefined) updateData.teacher_id = fields.teacherId;
    if (fields.classId !== undefined) updateData.class_id = fields.classId;
    if (fields.plannedHours !== undefined) updateData.planned_hours = fields.plannedHours;

    const result = await this.coursePlanRepository
      .createQueryBuilder()
      .update(CoursePlan)
      .set(updateData)
      .where('id = :id AND version = :version', { id, version })
      .execute();

    if (result.affected === 0) {
      throw new ConflictException(
        '该课程计划已被其他用户修改，请刷新后重试。',
      );
    }

    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    const plan = await this.findOne(id);
    await this.coursePlanRepository.remove(plan);
  }
}
