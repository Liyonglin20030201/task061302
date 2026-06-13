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
import { CoursesService } from './courses.service';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';

@ApiTags('Courses')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('courses')
export class CoursesController {
  constructor(private readonly coursesService: CoursesService) {}

  @Get()
  @ApiOperation({ summary: '获取课程列表' })
  async findAll(@Query() pagination: PaginationDto) {
    const result = await this.coursesService.findAll(pagination);
    return ApiResponse.success(result);
  }

  @Post()
  @Roles('admin')
  @ApiOperation({ summary: '创建课程' })
  async create(@Body() dto: CreateCourseDto) {
    const course = await this.coursesService.create(dto);
    return ApiResponse.success(course);
  }

  @Get(':id')
  @ApiOperation({ summary: '获取课程详情' })
  async findOne(@Param('id') id: string) {
    const course = await this.coursesService.findOne(id);
    return ApiResponse.success(course);
  }

  @Patch(':id')
  @Roles('admin')
  @ApiOperation({ summary: '更新课程' })
  async update(@Param('id') id: string, @Body() dto: UpdateCourseDto) {
    const course = await this.coursesService.update(id, dto);
    return ApiResponse.success(course);
  }

  @Delete(':id')
  @Roles('admin')
  @ApiOperation({ summary: '删除课程' })
  async remove(@Param('id') id: string) {
    await this.coursesService.remove(id);
    return ApiResponse.success(null);
  }
}
