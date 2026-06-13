import {
  Controller,
  Get,
  Post,
  Patch,
  Put,
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
import { TeachersService } from './teachers.service';
import { CreateTeacherDto } from './dto/create-teacher.dto';
import { UpdateTeacherDto } from './dto/update-teacher.dto';
import { SetAvailabilityDto } from './dto/set-availability.dto';

@ApiTags('Teachers')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('teachers')
export class TeachersController {
  constructor(private readonly teachersService: TeachersService) {}

  @Get()
  @Roles('admin', 'teacher')
  @ApiOperation({ summary: '获取教师列表' })
  async findAll(
    @Query() pagination: PaginationDto,
    @Query('department') department?: string,
  ) {
    const result = await this.teachersService.findAll(pagination, department);
    return ApiResponse.success(result);
  }

  @Post()
  @Roles('admin')
  @ApiOperation({ summary: '创建教师' })
  async create(@Body() dto: CreateTeacherDto) {
    const teacher = await this.teachersService.create(dto);
    return ApiResponse.success(teacher);
  }

  @Get(':id')
  @ApiOperation({ summary: '获取教师详情' })
  async findOne(@Param('id') id: string) {
    const teacher = await this.teachersService.findOne(id);
    return ApiResponse.success(teacher);
  }

  @Patch(':id')
  @Roles('admin')
  @ApiOperation({ summary: '更新教师' })
  async update(@Param('id') id: string, @Body() dto: UpdateTeacherDto) {
    const teacher = await this.teachersService.update(id, dto);
    return ApiResponse.success(teacher);
  }

  @Delete(':id')
  @Roles('admin')
  @ApiOperation({ summary: '删除教师' })
  async remove(@Param('id') id: string) {
    await this.teachersService.remove(id);
    return ApiResponse.success(null);
  }

  @Get(':id/availability')
  @ApiOperation({ summary: '获取教师可用时间' })
  async getAvailability(@Param('id') id: string) {
    const availability = await this.teachersService.getAvailability(id);
    return ApiResponse.success(availability);
  }

  @Put(':id/availability')
  @Roles('admin', 'teacher')
  @ApiOperation({ summary: '设置教师可用时间' })
  async setAvailability(
    @Param('id') id: string,
    @Body() dto: SetAvailabilityDto,
  ) {
    const availability = await this.teachersService.setAvailability(id, dto);
    return ApiResponse.success(availability);
  }
}
