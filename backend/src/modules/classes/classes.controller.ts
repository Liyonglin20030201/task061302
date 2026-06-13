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
import { ClassesService } from './classes.service';
import { CreateClassDto } from './dto/create-class.dto';
import { UpdateClassDto } from './dto/update-class.dto';

@ApiTags('Classes')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('classes')
export class ClassesController {
  constructor(private readonly classesService: ClassesService) {}

  @Get()
  @ApiOperation({ summary: '获取班级列表' })
  async findAll(@Query() pagination: PaginationDto) {
    const result = await this.classesService.findAll(pagination);
    return ApiResponse.success(result);
  }

  @Post()
  @Roles('admin')
  @ApiOperation({ summary: '创建班级' })
  async create(@Body() dto: CreateClassDto) {
    const classEntity = await this.classesService.create(dto);
    return ApiResponse.success(classEntity);
  }

  @Get(':id')
  @ApiOperation({ summary: '获取班级详情' })
  async findOne(@Param('id') id: string) {
    const classEntity = await this.classesService.findOne(id);
    return ApiResponse.success(classEntity);
  }

  @Patch(':id')
  @Roles('admin')
  @ApiOperation({ summary: '更新班级' })
  async update(@Param('id') id: string, @Body() dto: UpdateClassDto) {
    const classEntity = await this.classesService.update(id, dto);
    return ApiResponse.success(classEntity);
  }

  @Delete(':id')
  @Roles('admin')
  @ApiOperation({ summary: '删除班级' })
  async remove(@Param('id') id: string) {
    await this.classesService.remove(id);
    return ApiResponse.success(null);
  }
}
