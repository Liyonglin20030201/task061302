import { IsString, IsNotEmpty, IsUUID, IsInt, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCoursePlanDto {
  @ApiProperty({ description: '学期 (如: 2024-2025-1)' })
  @IsString()
  @IsNotEmpty()
  semester: string;

  @ApiProperty({ description: '课程ID' })
  @IsUUID()
  courseId: string;

  @ApiProperty({ description: '教师ID' })
  @IsUUID()
  teacherId: string;

  @ApiProperty({ description: '班级ID' })
  @IsUUID()
  classId: string;

  @ApiProperty({ description: '计划课时' })
  @IsInt()
  @Min(1)
  plannedHours: number;
}
