import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Teacher } from '../../database/entities/teacher.entity';
import { TeacherAvailability } from '../../database/entities/teacher-availability.entity';
import { TeachersService } from './teachers.service';
import { TeachersController } from './teachers.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Teacher, TeacherAvailability])],
  controllers: [TeachersController],
  providers: [TeachersService],
  exports: [TeachersService],
})
export class TeachersModule {}
