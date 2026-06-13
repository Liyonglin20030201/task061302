import { IsUUID, IsInt, Min, Max, IsOptional, IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateScheduleChangeDto {
  @ApiProperty() @IsUUID() scheduleId: string;

  @ApiPropertyOptional() @IsOptional() @IsUUID() newRoomId?: string;
  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(1) @Max(7) newDayOfWeek?: number;
  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(1) @Max(12) newPeriod?: number;
  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(1) @Max(30) newWeekStart?: number;
  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(1) @Max(30) newWeekEnd?: number;

  @ApiProperty() @IsString() @IsNotEmpty() reason: string;
}
