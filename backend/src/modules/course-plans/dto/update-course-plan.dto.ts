import { PartialType } from '@nestjs/swagger';
import { IsInt, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CreateCoursePlanDto } from './create-course-plan.dto';

export class UpdateCoursePlanDto extends PartialType(CreateCoursePlanDto) {
  @ApiProperty({ description: 'Current version for optimistic locking' })
  @IsInt()
  version: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEnum(['draft', 'approved', 'scheduled'])
  status?: string;
}
