import { IsString, IsNotEmpty, IsInt, Min, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCourseDto {
  @ApiProperty({ description: '课程名称' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: '课程编号' })
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiProperty({ description: '课时数' })
  @IsInt()
  @Min(1)
  hours: number;

  @ApiPropertyOptional({ description: '课程类型' })
  @IsOptional()
  @IsString()
  courseType?: string;

  @ApiPropertyOptional({ description: '课程描述' })
  @IsOptional()
  @IsString()
  description?: string;
}
