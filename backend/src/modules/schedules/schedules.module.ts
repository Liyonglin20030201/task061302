import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Schedule } from '../../database/entities/schedule.entity';
import { ScheduleHistory } from '../../database/entities/schedule-history.entity';
import { CoursePlan } from '../../database/entities/course-plan.entity';
import { TrainingRoom } from '../../database/entities/training-room.entity';
import { TeacherAvailability } from '../../database/entities/teacher-availability.entity';
import { SchedulesService } from './schedules.service';
import { SchedulesController } from './schedules.controller';
import { AutoSchedulerService } from './services/auto-scheduler.service';
import { ConflictDetectionService } from './services/conflict-detection.service';

@Module({
  imports: [TypeOrmModule.forFeature([Schedule, ScheduleHistory, CoursePlan, TrainingRoom, TeacherAvailability])],
  controllers: [SchedulesController],
  providers: [SchedulesService, AutoSchedulerService, ConflictDetectionService],
  exports: [SchedulesService, ConflictDetectionService],
})
export class SchedulesModule {}
