import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleChange } from '../../database/entities/schedule-change.entity';
import { Schedule } from '../../database/entities/schedule.entity';
import { ScheduleHistory } from '../../database/entities/schedule-history.entity';
import { ScheduleChangesService } from './schedule-changes.service';
import { ScheduleChangesController } from './schedule-changes.controller';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ScheduleChange, Schedule, ScheduleHistory]),
    NotificationsModule,
  ],
  controllers: [ScheduleChangesController],
  providers: [ScheduleChangesService],
})
export class ScheduleChangesModule {}
