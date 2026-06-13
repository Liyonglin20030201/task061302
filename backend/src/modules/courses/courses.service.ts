import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Course } from '../../database/entities/course.entity';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { PaginationDto, PaginatedResult } from '../../common/dto/pagination.dto';

@Injectable()
export class CoursesService {
  constructor(
    @InjectRepository(Course)
    private readonly courseRepository: Repository<Course>,
  ) {}

  async create(dto: CreateCourseDto): Promise<Course> {
    const course = this.courseRepository.create({
      name: dto.name,
      code: dto.code,
      hours: dto.hours,
      course_type: dto.courseType,
      description: dto.description,
    });
    return this.courseRepository.save(course);
  }

  async findAll(pagination: PaginationDto): Promise<PaginatedResult<Course>> {
    const page = pagination.page || 1;
    const limit = pagination.limit || 20;
    const [data, total] = await this.courseRepository.findAndCount({
      skip: (page - 1) * limit,
      take: limit,
      order: { created_at: 'DESC' },
    });
    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string): Promise<Course> {
    const course = await this.courseRepository.findOne({ where: { id } });
    if (!course) {
      throw new NotFoundException(`Course with id ${id} not found`);
    }
    return course;
  }

  async update(id: string, dto: UpdateCourseDto): Promise<Course> {
    const course = await this.findOne(id);
    if (dto.name !== undefined) course.name = dto.name;
    if (dto.code !== undefined) course.code = dto.code;
    if (dto.hours !== undefined) course.hours = dto.hours;
    if (dto.courseType !== undefined) course.course_type = dto.courseType;
    if (dto.description !== undefined) course.description = dto.description;
    return this.courseRepository.save(course);
  }

  async remove(id: string): Promise<void> {
    const course = await this.findOne(id);
    await this.courseRepository.remove(course);
  }
}
