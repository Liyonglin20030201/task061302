import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Class } from '../../database/entities/class.entity';
import { CreateClassDto } from './dto/create-class.dto';
import { UpdateClassDto } from './dto/update-class.dto';
import { PaginationDto, PaginatedResult } from '../../common/dto/pagination.dto';

@Injectable()
export class ClassesService {
  constructor(
    @InjectRepository(Class)
    private readonly classRepository: Repository<Class>,
  ) {}

  async create(dto: CreateClassDto): Promise<Class> {
    const classEntity = this.classRepository.create({
      name: dto.name,
      grade: dto.grade,
      major: dto.major,
      student_count: dto.studentCount,
      department: dto.department,
    });
    return this.classRepository.save(classEntity);
  }

  async findAll(pagination: PaginationDto): Promise<PaginatedResult<Class>> {
    const page = pagination.page || 1;
    const limit = pagination.limit || 20;
    const [data, total] = await this.classRepository.findAndCount({
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

  async findOne(id: string): Promise<Class> {
    const classEntity = await this.classRepository.findOne({ where: { id } });
    if (!classEntity) {
      throw new NotFoundException(`Class with id ${id} not found`);
    }
    return classEntity;
  }

  async update(id: string, dto: UpdateClassDto): Promise<Class> {
    const classEntity = await this.findOne(id);
    if (dto.name !== undefined) classEntity.name = dto.name;
    if (dto.grade !== undefined) classEntity.grade = dto.grade;
    if (dto.major !== undefined) classEntity.major = dto.major;
    if (dto.studentCount !== undefined) classEntity.student_count = dto.studentCount;
    if (dto.department !== undefined) classEntity.department = dto.department;
    return this.classRepository.save(classEntity);
  }

  async remove(id: string): Promise<void> {
    const classEntity = await this.findOne(id);
    await this.classRepository.remove(classEntity);
  }
}
