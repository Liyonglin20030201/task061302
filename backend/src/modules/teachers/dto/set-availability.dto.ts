import { IsArray, ValidateNested, IsInt, IsBoolean, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

class AvailabilitySlotDto {
  @ApiProperty({ description: '星期几 (1-7)' })
  @IsInt()
  @Min(1)
  @Max(7)
  dayOfWeek: number;

  @ApiProperty({ description: '第几节课 (1-12)' })
  @IsInt()
  @Min(1)
  @Max(12)
  period: number;

  @ApiProperty({ description: '是否可用' })
  @IsBoolean()
  isAvailable: boolean;
}

export class SetAvailabilityDto {
  @ApiProperty({ description: '可用时间段列表', type: [AvailabilitySlotDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AvailabilitySlotDto)
  slots: AvailabilitySlotDto[];
}
