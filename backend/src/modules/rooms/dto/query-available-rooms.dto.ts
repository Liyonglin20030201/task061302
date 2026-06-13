import { IsInt, IsOptional, IsString, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class QueryAvailableRoomsDto {
  @ApiProperty({ description: '星期几 (1-7)' })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(7)
  dayOfWeek: number;

  @ApiProperty({ description: '第几节课 (1-12)' })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(12)
  period: number;

  @ApiProperty({ description: '开始周' })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  weekStart: number;

  @ApiProperty({ description: '结束周' })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  weekEnd: number;

  @ApiPropertyOptional({ description: '最小容纳人数' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  minCapacity?: number;

  @ApiPropertyOptional({ description: '设备类型' })
  @IsOptional()
  @IsString()
  equipmentType?: string;
}
