import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Teacher } from '../../database/entities/teacher.entity';
import { TeacherAvailability } from '../../database/entities/teacher-availability.entity';
import { CreateTeacherDto } from './dto/create-teacher.dto';
import { UpdateTeacherDto } from './dto/update-teacher.dto';
import { SetAvailabilityDto } from './dto/set-availability.dto';
import { PaginationDto, PaginatedResult } from '../../common/dto/pagination.dto';

@Injectable()
export class TeachersService {
  constructor(
    @InjectRepository(Teacher)
    private readonly teacherRepository: Repository<Teacher>,
    @InjectRepository(TeacherAvailability)
    private readonly availabilityRepository: Repository<TeacherAvailability>,
  ) {}

  async create(dto: CreateTeacherDto): Promise<Teacher> {
    const teacher = this.teacherRepository.create({
      user_id: dto.userId,
      name: dto.name,
      employee_no: dto.employeeNo,
      title: dto.title,
      department: dto.department,
      phone: dto.phone,
      email: dto.email,
      qualifications: dto.qualifications,
    });
    return this.teacherRepository.save(teacher);
  }

  async findAll(
    pagination: PaginationDto,
    department?: string,
  ): Promise<PaginatedResult<Teacher>> {
    const page = pagination.page || 1;
    const limit = pagination.limit || 20;
    const qb = this.teacherRepository.createQueryBuilder('teacher');

    if (department) {
      qb.where('teacher.department = :department', { department });
    }

    qb.orderBy('teacher.created_at', 'DESC')
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

  async findOne(id: string): Promise<Teacher> {
    const teacher = await this.teacherRepository.findOne({
      where: { id },
      relations: ['user', 'availabilities'],
    });
    if (!teacher) {
      throw new NotFoundException(`Teacher with id ${id} not found`);
    }
    return teacher;
  }

  async update(id: string, dto: UpdateTeacherDto): Promise<Teacher> {
    const teacher = await this.findOne(id);
    if (dto.userId !== undefined) teacher.user_id = dto.userId;
    if (dto.name !== undefined) teacher.name = dto.name;
    if (dto.employeeNo !== undefined) teacher.employee_no = dto.employeeNo;
    if (dto.title !== undefined) teacher.title = dto.title;
    if (dto.department !== undefined) teacher.department = dto.department;
    if (dto.phone !== undefined) teacher.phone = dto.phone;
    if (dto.email !== undefined) teacher.email = dto.email;
    if (dto.qualifications !== undefined) teacher.qualifications = dto.qualifications;
    return this.teacherRepository.save(teacher);
  }

  async remove(id: string): Promise<void> {
    const teacher = await this.findOne(id);
    await this.teacherRepository.remove(teacher);
  }

  async getAvailability(teacherId: string): Promise<TeacherAvailability[]> {
    return this.availabilityRepository.find({
      where: { teacher_id: teacherId },
      order: { day_of_week: 'ASC', period: 'ASC' },
    });
  }

  async setAvailability(
    teacherId: string,
    dto: SetAvailabilityDto,
  ): Promise<TeacherAvailability[]> {
    // Ensure teacher exists
    await this.findOne(teacherId);

    // Remove existing availability for this teacher
    await this.availabilityRepository.delete({ teacher_id: teacherId });

    // Create new availability records
    const entities = dto.slots.map((slot) =>
      this.availabilityRepository.create({
        teacher_id: teacherId,
        day_of_week: slot.dayOfWeek,
        period: slot.period,
        is_available: slot.isAvailable,
      }),
    );

    return this.availabilityRepository.save(entities);
  }
}
