import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from '../../database/entities/audit-log.entity';
import { PaginationDto, PaginatedResult } from '../../common/dto/pagination.dto';

export interface CreateAuditLogDto {
  userId?: string;
  action: string;
  resourceType: string;
  resourceId?: string;
  detailsJson?: Record<string, any>;
  ipAddress?: string;
}

@Injectable()
export class AuditLogsService {
  constructor(
    @InjectRepository(AuditLog)
    private readonly auditRepo: Repository<AuditLog>,
  ) {}

  async create(dto: CreateAuditLogDto): Promise<AuditLog> {
    const log = this.auditRepo.create({
      user_id: dto.userId,
      action: dto.action,
      resource_type: dto.resourceType,
      resource_id: dto.resourceId,
      details_json: dto.detailsJson,
      ip_address: dto.ipAddress,
    });
    return this.auditRepo.save(log);
  }

  async findAll(
    pagination: PaginationDto,
    filters: { userId?: string; action?: string; resourceType?: string; startDate?: string; endDate?: string },
  ): Promise<PaginatedResult<AuditLog>> {
    const page = pagination.page || 1;
    const limit = pagination.limit || 20;
    const qb = this.auditRepo.createQueryBuilder('al')
      .leftJoinAndSelect('al.user', 'u');

    if (filters.userId) qb.andWhere('al.user_id = :userId', { userId: filters.userId });
    if (filters.action) qb.andWhere('al.action = :action', { action: filters.action });
    if (filters.resourceType) qb.andWhere('al.resource_type = :rt', { rt: filters.resourceType });
    if (filters.startDate) qb.andWhere('al.created_at >= :start', { start: filters.startDate });
    if (filters.endDate) qb.andWhere('al.created_at <= :end', { end: filters.endDate });

    const [data, total] = await qb
      .orderBy('al.created_at', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }
}
