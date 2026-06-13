import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { ApiResponse } from '../../common/dto/api-response.dto';
import { ScheduleChangesService } from './schedule-changes.service';
import { CreateScheduleChangeDto } from './dto/create-schedule-change.dto';

@ApiTags('Schedule Changes')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('schedule-changes')
export class ScheduleChangesController {
  constructor(private readonly service: ScheduleChangesService) {}

  @Post()
  @ApiOperation({ summary: 'Submit schedule change request' })
  async create(@Body() dto: CreateScheduleChangeDto, @CurrentUser('id') userId: string) {
    const result = await this.service.create(dto, userId);
    return ApiResponse.success(result, 'Change request submitted');
  }

  @Get()
  @ApiOperation({ summary: 'List schedule change requests' })
  async findAll(
    @Query() pagination: PaginationDto,
    @Query('status') status?: string,
    @Query('requesterId') requesterId?: string,
  ) {
    const result = await this.service.findAll(pagination, { status, requesterId });
    return ApiResponse.success(result);
  }

  @Patch(':id/approve')
  @Roles('admin')
  @ApiOperation({ summary: 'Approve schedule change request' })
  async approve(@Param('id') id: string, @CurrentUser('id') userId: string) {
    const result = await this.service.approve(id, userId);
    return ApiResponse.success(result, 'Change request approved');
  }

  @Patch(':id/reject')
  @Roles('admin')
  @ApiOperation({ summary: 'Reject schedule change request' })
  async reject(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Body('reason') reason?: string,
  ) {
    const result = await this.service.reject(id, userId, reason);
    return ApiResponse.success(result, 'Change request rejected');
  }
}
