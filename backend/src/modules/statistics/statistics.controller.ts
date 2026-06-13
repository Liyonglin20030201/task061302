import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { ApiResponse } from '../../common/dto/api-response.dto';
import { StatisticsService } from './statistics.service';

@ApiTags('Statistics')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('statistics')
export class StatisticsController {
  constructor(private readonly service: StatisticsService) {}

  @Get('overview')
  @ApiOperation({ summary: 'Get dashboard overview statistics' })
  async getOverview(@Query('semester') semester?: string) {
    const result = await this.service.getOverview(semester);
    return ApiResponse.success(result);
  }

  @Get('room-utilization')
  @ApiOperation({ summary: 'Get room utilization rates' })
  async getRoomUtilization(@Query('semester') semester?: string) {
    const result = await this.service.getRoomUtilization(semester);
    return ApiResponse.success(result);
  }

  @Get('teacher-workload')
  @ApiOperation({ summary: 'Get teacher workload statistics' })
  async getTeacherWorkload(@Query('semester') semester?: string) {
    const result = await this.service.getTeacherWorkload(semester);
    return ApiResponse.success(result);
  }

  @Get('class-hours')
  @ApiOperation({ summary: 'Get class hours statistics' })
  async getClassHours(@Query('semester') semester?: string) {
    const result = await this.service.getClassHours(semester);
    return ApiResponse.success(result);
  }
}
