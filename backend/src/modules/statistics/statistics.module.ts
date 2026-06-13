import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Schedule } from '../../database/entities/schedule.entity';
import { CoursePlan } from '../../database/entities/course-plan.entity';
import { TrainingRoom } from '../../database/entities/training-room.entity';
import { Teacher } from '../../database/entities/teacher.entity';
import { StatisticsService } from './statistics.service';
import { StatisticsController } from './statistics.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Schedule, CoursePlan, TrainingRoom, Teacher])],
  controllers: [StatisticsController],
  providers: [StatisticsService],
})
export class StatisticsModule {}
