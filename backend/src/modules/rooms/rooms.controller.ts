import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { ApiResponse } from '../../common/dto/api-response.dto';
import { RoomsService } from './rooms.service';
import { CreateRoomDto } from './dto/create-room.dto';
import { UpdateRoomDto } from './dto/update-room.dto';
import { QueryAvailableRoomsDto } from './dto/query-available-rooms.dto';
import { RoomStatus } from '../../database/entities/enums';

@ApiTags('Rooms')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('rooms')
export class RoomsController {
  constructor(private readonly roomsService: RoomsService) {}

  @Get('available')
  @ApiOperation({ summary: '查询可用实训室' })
  async findAvailable(@Query() query: QueryAvailableRoomsDto) {
    const rooms = await this.roomsService.findAvailable(query);
    return ApiResponse.success(rooms);
  }

  @Get()
  @ApiOperation({ summary: '获取实训室列表' })
  async findAll(
    @Query() pagination: PaginationDto,
    @Query('status') status?: RoomStatus,
    @Query('building') building?: string,
    @Query('equipmentType') equipmentType?: string,
  ) {
    const result = await this.roomsService.findAll(pagination, {
      status,
      building,
      equipmentType,
    });
    return ApiResponse.success(result);
  }

  @Post()
  @Roles('admin')
  @ApiOperation({ summary: '创建实训室' })
  async create(@Body() dto: CreateRoomDto) {
    const room = await this.roomsService.create(dto);
    return ApiResponse.success(room);
  }

  @Get(':id')
  @ApiOperation({ summary: '获取实训室详情' })
  async findOne(@Param('id') id: string) {
    const room = await this.roomsService.findOne(id);
    return ApiResponse.success(room);
  }

  @Patch(':id')
  @Roles('admin')
  @ApiOperation({ summary: '更新实训室' })
  async update(@Param('id') id: string, @Body() dto: UpdateRoomDto) {
    const room = await this.roomsService.update(id, dto);
    return ApiResponse.success(room);
  }

  @Delete(':id')
  @Roles('admin')
  @ApiOperation({ summary: '删除实训室' })
  async remove(@Param('id') id: string) {
    await this.roomsService.remove(id);
    return ApiResponse.success(null);
  }
}
