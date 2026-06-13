import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../../database/entities/user.entity';
import { UserStatus } from '../../database/entities/enums';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PaginationDto, PaginatedResult } from '../../common/dto/pagination.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async create(dto: CreateUserDto): Promise<User> {
    const passwordHash = await bcrypt.hash(dto.password, 12);
    const user = this.userRepository.create({
      username: dto.username,
      password_hash: passwordHash,
      role: dto.role,
    });
    return this.userRepository.save(user);
  }

  async findAll(pagination: PaginationDto): Promise<PaginatedResult<User>> {
    const page = pagination.page || 1;
    const limit = pagination.limit || 20;
    const [data, total] = await this.userRepository.findAndCount({
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

  async findOne(id: string): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(`User with id ${id} not found`);
    }
    return user;
  }

  async update(id: string, dto: UpdateUserDto): Promise<User> {
    const user = await this.findOne(id);
    if (dto.password) {
      user.password_hash = await bcrypt.hash(dto.password, 12);
    }
    if (dto.username !== undefined) {
      user.username = dto.username;
    }
    if (dto.role !== undefined) {
      user.role = dto.role;
    }
    return this.userRepository.save(user);
  }

  async remove(id: string): Promise<void> {
    const user = await this.findOne(id);
    user.status = UserStatus.INACTIVE;
    await this.userRepository.save(user);
  }
}
