import { IsUUID, IsInt, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateScheduleDto {
  @ApiProperty()
  @IsUUID()
  coursePlanId: string;

  @ApiProperty()
  @IsUUID()
  roomId: string;

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
}
