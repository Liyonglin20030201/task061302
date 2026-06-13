import { PartialType } from '@nestjs/swagger';
import { IsInt, IsNotEmpty } from 'class-validator';
import { CreateCoursePlanDto } from './create-course-plan.dto';

export class UpdateCoursePlanDto extends PartialType(CreateCoursePlanDto) {
  @IsInt()
  @IsNotEmpty()
  version: number;
}
