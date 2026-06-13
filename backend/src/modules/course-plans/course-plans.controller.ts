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
import { CoursePlansService } from './course-plans.service';
import { CreateCoursePlanDto } from './dto/create-course-plan.dto';
import { UpdateCoursePlanDto } from './dto/update-course-plan.dto';

@ApiTags('Course Plans')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('course-plans')
export class CoursePlansController {
  constructor(private readonly coursePlansService: CoursePlansService) {}

  @Get()
  @ApiOperation({ summary: '获取教学计划列表' })
  async findAll(
    @Query() pagination: PaginationDto,
    @Query('semester') semester?: string,
  ) {
    const result = await this.coursePlansService.findAll(pagination, semester);
    return ApiResponse.success(result);
  }

  @Post()
  @Roles('admin')
  @ApiOperation({ summary: '创建教学计划' })
  async create(@Body() dto: CreateCoursePlanDto) {
    const plan = await this.coursePlansService.create(dto);
    return ApiResponse.success(plan);
  }

  @Post('batch')
  @Roles('admin')
  @ApiOperation({ summary: '批量创建教学计划' })
  async createBatch(@Body() dtos: CreateCoursePlanDto[]) {
    const plans = await this.coursePlansService.createBatch(dtos);
    return ApiResponse.success(plans);
  }

  @Get(':id')
  @ApiOperation({ summary: '获取教学计划详情' })
  async findOne(@Param('id') id: string) {
    const plan = await this.coursePlansService.findOne(id);
    return ApiResponse.success(plan);
  }

  @Patch(':id')
  @Roles('admin')
  @ApiOperation({ summary: '更新教学计划' })
  async update(@Param('id') id: string, @Body() dto: UpdateCoursePlanDto) {
    const plan = await this.coursePlansService.update(id, dto);
    return ApiResponse.success(plan);
  }

  @Delete(':id')
  @Roles('admin')
  @ApiOperation({ summary: '删除教学计划' })
  async remove(@Param('id') id: string) {
    await this.coursePlansService.remove(id);
    return ApiResponse.success(null);
  }
}
