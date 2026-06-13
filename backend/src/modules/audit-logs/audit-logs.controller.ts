import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { ApiResponse } from '../../common/dto/api-response.dto';
import { AuditLogsService } from './audit-logs.service';

@ApiTags('Audit Logs')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
@Controller('audit-logs')
export class AuditLogsController {
  constructor(private readonly service: AuditLogsService) {}

  @Get()
  @ApiOperation({ summary: 'List audit logs (admin only)' })
  async findAll(
    @Query() pagination: PaginationDto,
    @Query('userId') userId?: string,
    @Query('action') action?: string,
    @Query('resourceType') resourceType?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const result = await this.service.findAll(pagination, {
      userId, action, resourceType, startDate, endDate,
    });
    return ApiResponse.success(result);
  }
}
