import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { Roles } from '../auth/decorators/public.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { AdminDashboardService } from './admin-dashboard.service';
import type { AdminDateFilters } from './admin-dashboard.service';

@ApiTags('Admin')
@ApiBearerAuth('JWT-auth')
@Controller('admin/dashboard')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class AdminDashboardController {
  constructor(private readonly adminDashboardService: AdminDashboardService) {}

  @Get('overview')
  async getOverview(@Query() query: AdminDateFilters) {
    const data = await this.adminDashboardService.getOverview(query);
    return { success: true, data };
  }

  @Get('user-growth')
  async getUserGrowth(
    @Query() query: AdminDateFilters & { aggregate?: string },
  ) {
    if (query.aggregate === 'roles') {
      const data = await this.adminDashboardService.getUserRoles(query);
      return { success: true, data };
    }

    if (query.aggregate === 'monthly') {
      const data = await this.adminDashboardService.getUserMonthly(query);
      return { success: true, data };
    }

    const data = await this.adminDashboardService.getUserGrowth(query);
    return { success: true, data };
  }

  @Get('classrooms')
  async getClassrooms(@Query() query: AdminDateFilters) {
    const data = await this.adminDashboardService.getClassrooms(query);
    return { success: true, data };
  }

  @Get('ai-usage')
  async getAiUsage(@Query() query: AdminDateFilters) {
    const data = await this.adminDashboardService.getAiUsage(query);
    return { success: true, data };
  }

  @Get('revenue')
  async getRevenue(@Query() query: AdminDateFilters) {
    const data = await this.adminDashboardService.getRevenue(query);
    return { success: true, data };
  }

  @Get('transactions')
  async getTransactions(@Query() query: AdminDateFilters) {
    const data = await this.adminDashboardService.getTransactions(query);
    return { success: true, data };
  }

  @Get('reviews')
  async getReviews(@Query() query: AdminDateFilters) {
    const data = await this.adminDashboardService.getReviews(query);
    return { success: true, data };
  }

  @Get('users')
  async getUsers(@Query() query: AdminDateFilters) {
    const data = await this.adminDashboardService.getUsers(query);
    return { success: true, data };
  }
}
