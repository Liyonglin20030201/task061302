import { IsUUID, IsInt, Min, Max, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CheckConflictDto {
  @ApiProperty()
  @IsUUID()
  roomId: string;

  @ApiProperty()
  @IsUUID()
  teacherId: string;

  @ApiProperty()
  @IsUUID()
  classId: string;

  @ApiProperty()
  @IsInt()
  @Min(1)
  @Max(7)
  dayOfWeek: number;

  @ApiProperty()
  @IsInt()
  @Min(1)
  @Max(12)
  period: number;

  @ApiProperty()
  @IsInt()
  @Min(1)
  @Max(30)
  weekStart: number;

  @ApiProperty()
  @IsInt()
  @Min(1)
  @Max(30)
  weekEnd: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  excludeScheduleId?: string;
}
