import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CoursePlan } from '../../database/entities/course-plan.entity';
import { CoursePlansService } from './course-plans.service';
import { CoursePlansController } from './course-plans.controller';

@Module({
  imports: [TypeOrmModule.forFeature([CoursePlan])],
  controllers: [CoursePlansController],
  providers: [CoursePlansService],
  exports: [CoursePlansService],
})
export class CoursePlansModule {}
