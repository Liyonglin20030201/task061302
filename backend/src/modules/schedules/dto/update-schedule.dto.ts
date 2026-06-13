import { IsUUID, IsInt, Min, Max, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateScheduleDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  roomId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(7)
  dayOfWeek?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(12)
  period?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(30)
  weekStart?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(30)
  weekEnd?: number;

  @ApiProperty({ description: 'Current version for optimistic locking' })
  @IsInt()
  version: number;
}
