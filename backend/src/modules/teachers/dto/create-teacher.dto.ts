import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsUUID,
  IsEmail,
  IsArray,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateTeacherDto {
  @ApiPropertyOptional({ description: '关联用户ID' })
  @IsOptional()
  @IsUUID()
  userId?: string;

  @ApiProperty({ description: '教师姓名' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: '工号' })
  @IsString()
  @IsNotEmpty()
  employeeNo: string;

  @ApiPropertyOptional({ description: '职称' })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({ description: '部门' })
  @IsOptional()
  @IsString()
  department?: string;

  @ApiPropertyOptional({ description: '联系电话' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ description: '邮箱' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ description: '资质信息', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  qualifications?: string[];
}
