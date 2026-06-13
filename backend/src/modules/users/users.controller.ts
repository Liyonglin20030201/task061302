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
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@ApiTags('Users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @ApiOperation({ summary: '获取用户列表' })
  async findAll(@Query() pagination: PaginationDto) {
    const result = await this.usersService.findAll(pagination);
    return ApiResponse.success(result);
  }

  @Post()
  @ApiOperation({ summary: '创建用户' })
  async create(@Body() dto: CreateUserDto) {
    const user = await this.usersService.create(dto);
    return ApiResponse.success(user);
  }

  @Get(':id')
  @ApiOperation({ summary: '获取用户详情' })
  async findOne(@Param('id') id: string) {
    const user = await this.usersService.findOne(id);
    return ApiResponse.success(user);
  }

  @Patch(':id')
  @ApiOperation({ summary: '更新用户' })
  async update(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    const user = await this.usersService.update(id, dto);
    return ApiResponse.success(user);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除用户(软删除)' })
  async remove(@Param('id') id: string) {
    await this.usersService.remove(id);
    return ApiResponse.success(null);
  }
}
