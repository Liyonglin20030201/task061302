import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TrainingRoom } from '../../database/entities/training-room.entity';
import { RoomStatus } from '../../database/entities/enums';
import { CreateRoomDto } from './dto/create-room.dto';
import { UpdateRoomDto } from './dto/update-room.dto';
import { QueryAvailableRoomsDto } from './dto/query-available-rooms.dto';
import { PaginationDto, PaginatedResult } from '../../common/dto/pagination.dto';

@Injectable()
export class RoomsService {
  constructor(
    @InjectRepository(TrainingRoom)
    private readonly roomRepository: Repository<TrainingRoom>,
  ) {}

  async create(dto: CreateRoomDto): Promise<TrainingRoom> {
    const room = this.roomRepository.create({
      name: dto.name,
      building: dto.building,
      floor: dto.floor,
      capacity: dto.capacity,
      equipment_type: dto.equipmentType,
      equipment_count: dto.equipmentCount ?? 0,
      status: dto.status ?? RoomStatus.AVAILABLE,
    });
    return this.roomRepository.save(room);
  }

  async findAll(
    pagination: PaginationDto,
    filters?: { status?: RoomStatus; building?: string; equipmentType?: string },
  ): Promise<PaginatedResult<TrainingRoom>> {
    const page = pagination.page || 1;
    const limit = pagination.limit || 20;
    const qb = this.roomRepository.createQueryBuilder('room');

    if (filters?.status) {
      qb.andWhere('room.status = :status', { status: filters.status });
    }
    if (filters?.building) {
      qb.andWhere('room.building = :building', { building: filters.building });
    }
    if (filters?.equipmentType) {
      qb.andWhere('room.equipment_type = :equipmentType', {
        equipmentType: filters.equipmentType,
      });
    }

    qb.orderBy('room.created_at', 'DESC')
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

  async findOne(id: string): Promise<TrainingRoom> {
    const room = await this.roomRepository.findOne({ where: { id } });
    if (!room) {
      throw new NotFoundException(`Room with id ${id} not found`);
    }
    return room;
  }

  async update(id: string, dto: UpdateRoomDto): Promise<TrainingRoom> {
    const room = await this.findOne(id);
    if (dto.name !== undefined) room.name = dto.name;
    if (dto.building !== undefined) room.building = dto.building;
    if (dto.floor !== undefined) room.floor = dto.floor;
    if (dto.capacity !== undefined) room.capacity = dto.capacity;
    if (dto.equipmentType !== undefined) room.equipment_type = dto.equipmentType;
    if (dto.equipmentCount !== undefined) room.equipment_count = dto.equipmentCount;
    if (dto.status !== undefined) room.status = dto.status;
    return this.roomRepository.save(room);
  }

  async remove(id: string): Promise<void> {
    const room = await this.findOne(id);
    await this.roomRepository.remove(room);
  }

  async findAvailable(query: QueryAvailableRoomsDto): Promise<TrainingRoom[]> {
    const qb = this.roomRepository.createQueryBuilder('room');

    // Only available rooms
    qb.where('room.status = :status', { status: RoomStatus.AVAILABLE });

    // Filter by minimum capacity
    if (query.minCapacity) {
      qb.andWhere('room.capacity >= :minCapacity', {
        minCapacity: query.minCapacity,
      });
    }

    // Filter by equipment type
    if (query.equipmentType) {
      qb.andWhere('room.equipment_type = :equipmentType', {
        equipmentType: query.equipmentType,
      });
    }

    // Exclude rooms that are already scheduled for the given time slot
    qb.andWhere(
      `room.id NOT IN (
        SELECT s.room_id FROM schedules s
        WHERE s.day_of_week = :dayOfWeek
          AND s.period = :period
          AND s.week_number >= :weekStart
          AND s.week_number <= :weekEnd
          AND s.status = 'active'
      )`,
      {
        dayOfWeek: query.dayOfWeek,
        period: query.period,
        weekStart: query.weekStart,
        weekEnd: query.weekEnd,
      },
    );

    qb.orderBy('room.capacity', 'ASC');

    return qb.getMany();
  }
}
