import { IsString, IsNotEmpty, IsInt, Min, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { RoomStatus } from '../../../database/entities/enums';

export class CreateRoomDto {
  @ApiProperty({ description: '实训室名称' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: '所在建筑' })
  @IsString()
  @IsNotEmpty()
  building: string;

  @ApiProperty({ description: '楼层' })
  @IsInt()
  floor: number;

  @ApiProperty({ description: '容纳人数' })
  @IsInt()
  @Min(1)
  capacity: number;

  @ApiPropertyOptional({ description: '设备类型' })
  @IsOptional()
  @IsString()
  equipmentType?: string;

  @ApiPropertyOptional({ description: '设备数量' })
  @IsOptional()
  @IsInt()
  @Min(0)
  equipmentCount?: number;

  @ApiPropertyOptional({ description: '状态', enum: RoomStatus })
  @IsOptional()
  @IsEnum(RoomStatus)
  status?: RoomStatus;
}
