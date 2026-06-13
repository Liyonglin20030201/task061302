import { IsString, IsNotEmpty, IsInt, Min, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateClassDto {
  @ApiProperty({ description: '班级名称' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: '年级' })
  @IsString()
  @IsNotEmpty()
  grade: string;

  @ApiProperty({ description: '专业' })
  @IsString()
  @IsNotEmpty()
  major: string;

  @ApiProperty({ description: '学生人数', minimum: 1 })
  @IsInt()
  @Min(1)
  studentCount: number;

  @ApiPropertyOptional({ description: '所属部门' })
  @IsOptional()
  @IsString()
  department?: string;
}
