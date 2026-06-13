import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from '../../database/entities/notification.entity';
import { PaginationDto, PaginatedResult } from '../../common/dto/pagination.dto';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private readonly notifRepo: Repository<Notification>,
  ) {}

  async send(userId: string, title: string, content: string, type: string): Promise<Notification> {
    const notification = this.notifRepo.create({
      user_id: userId,
      title,
      content,
      type,
      is_read: false,
    });
    return this.notifRepo.save(notification);
  }

  async findAll(userId: string, pagination: PaginationDto): Promise<PaginatedResult<Notification>> {
    const page = pagination.page || 1;
    const limit = pagination.limit || 20;
    const [data, total] = await this.notifRepo.findAndCount({
      where: { user_id: userId },
      order: { created_at: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async getUnreadCount(userId: string): Promise<number> {
    return this.notifRepo.count({
      where: { user_id: userId, is_read: false },
    });
  }

  async markAsRead(id: string, userId: string): Promise<void> {
    await this.notifRepo.update({ id, user_id: userId }, { is_read: true });
  }

  async markAllAsRead(userId: string): Promise<void> {
    await this.notifRepo.update(
      { user_id: userId, is_read: false },
      { is_read: true },
    );
  }
}
