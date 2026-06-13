import { PartialType } from '@nestjs/swagger';
import { CreateCoursePlanDto } from './create-course-plan.dto';

export class UpdateCoursePlanDto extends PartialType(CreateCoursePlanDto) {}
