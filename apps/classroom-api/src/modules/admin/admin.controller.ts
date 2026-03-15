import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Roles } from '../auth/decorators/public.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { AdminService } from './admin.service';
import {
  ComprehensiveDashboardDto,
  DailyComparisonDto,
  DailyRevenueDto,
  DashboardStatsDto,
  DateRangeAnalyticsDto,
  HourlyRevenueDto,
  MonthComparisonDto,
  MonthlyRevenueDto,
  RecentTransactionDto,
  RecentUserDto,
  SubscriptionStatsDto,
  TopProductsDto,
  TransactionMetricsDto,
  TrendingMetricsDto,
  UserGrowthDto,
  UserMetricsDto,
  YearOverYearDto,
} from './dtos';

@ApiTags('Admin Dashboard')
@Controller('admin/dashboard')
@ApiBearerAuth('JWT-auth')
@Roles('ADMIN')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  /**
   * Lấy thống kê overview dashboard
   */
  @Get('statistics')
  @ApiOperation({ summary: 'Lấy thống kê dashboard chính' })
  @ApiResponse({
    status: 200,
    description: 'Thống kê dashboard',
    type: DashboardStatsDto,
  })
  @ApiResponse({ status: 401, description: 'Chưa xác thực' })
  @ApiResponse({ status: 403, description: 'Không đủ quyền' })
  async getStatistics(): Promise<DashboardStatsDto> {
    return this.adminService.getDashboardStats();
  }

  /**
   * Lấy giao dịch gần đây nhất
   */
  @Get('recent-transactions')
  @ApiOperation({ summary: 'Lấy giao dịch gần đây nhất' })
  @ApiResponse({ status: 200, description: 'Danh sách giao dịch gần đây' })
  async getRecentTransactions(
    @Query('limit') limit?: string,
  ): Promise<RecentTransactionDto[]> {
    const limitNum = limit ? parseInt(limit, 10) : 10;
    return this.adminService.getRecentTransactions(limitNum);
  }

  /**
   * Lấy người dùng mới tạo gần đây
   */
  @Get('recent-users')
  @ApiOperation({ summary: 'Lấy người dùng mới tạo gần đây' })
  @ApiResponse({ status: 200, description: 'Danh sách người dùng mới' })
  async getRecentUsers(
    @Query('limit') limit?: string,
  ): Promise<RecentUserDto[]> {
    const limitNum = limit ? parseInt(limit, 10) : 10;
    return this.adminService.getRecentUsers(limitNum);
  }

  /**
   * Lấy doanh thu theo tháng
   */
  @Get('monthly-revenue')
  @ApiOperation({ summary: 'Lấy doanh thu theo tháng' })
  @ApiResponse({ status: 200, description: 'Doanh thu theo tháng' })
  async getMonthlyRevenue(
    @Query('months') months?: string,
  ): Promise<MonthlyRevenueDto[]> {
    const monthsBack = months ? parseInt(months, 10) : 12;
    return this.adminService.getMonthlyRevenue(monthsBack);
  }

  /**
   * Lấy thống kê theo gói subscription
   */
  @Get('subscription-stats')
  @ApiOperation({ summary: 'Lấy thống kê theo gói subscription' })
  @ApiResponse({ status: 200, description: 'Thống kê subscription' })
  async getSubscriptionStats(): Promise<SubscriptionStatsDto[]> {
    return this.adminService.getSubscriptionStats();
  }

  /**
   * Lấy số lượng user theo role
   */
  @Get('users-by-role')
  @ApiOperation({ summary: 'Lấy số lượng user theo role' })
  @ApiResponse({ status: 200, description: 'Thống kê user theo role' })
  async getUsersByRole(): Promise<Array<{ role: string; count: number }>> {
    return this.adminService.getUsersByRole();
  }

  /**
   * Lấy số lượng transaction theo status
   */
  @Get('transactions-by-status')
  @ApiOperation({ summary: 'Lấy số lượng transaction theo status' })
  @ApiResponse({ status: 200, description: 'Thống kê transaction theo status' })
  async getTransactionsByStatus(): Promise<
    Array<{ status: string; count: number }>
  > {
    return this.adminService.getTransactionsByStatus();
  }

  /**
   * Lấy tăng trưởng user theo tháng
   */
  @Get('user-growth')
  @ApiOperation({ summary: 'Lấy tăng trưởng user theo tháng' })
  @ApiResponse({ status: 200, description: 'Tăng trưởng user' })
  async getUserGrowth(
    @Query('months') months?: string,
  ): Promise<UserGrowthDto[]> {
    const monthsBack = months ? parseInt(months, 10) : 12;
    return this.adminService.getUserGrowth(monthsBack);
  }

  // ==================== ADVANCED ANALYTICS ENDPOINTS ====================

  /**
   * Lấy doanh thu theo ngày
   */
  @Get('daily-revenue')
  @ApiOperation({ summary: 'Lấy doanh thu theo ngày' })
  @ApiResponse({
    status: 200,
    description: 'Doanh thu theo ngày',
    type: [DailyRevenueDto],
  })
  async getDailyRevenue(
    @Query('days') days?: string,
  ): Promise<DailyRevenueDto[]> {
    const daysBack = days ? parseInt(days, 10) : 30;
    return this.adminService.getDailyRevenue(daysBack);
  }

  /**
   * So sánh doanh thu 2 ngày
   */
  @Get('compare-days')
  @ApiOperation({ summary: 'So sánh doanh thu 2 ngày' })
  @ApiResponse({
    status: 200,
    description: 'So sánh giữa 2 ngày',
    type: DailyComparisonDto,
  })
  async compareTwoDays(
    @Query('date1') date1?: string,
    @Query('date2') date2?: string,
  ): Promise<DailyComparisonDto> {
    if (!date1 || !date2) {
      // Default to today and yesterday
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      const formatDate = (d: Date) =>
        `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

      return this.adminService.compareTwoDays(
        formatDate(yesterday),
        formatDate(today),
      );
    }
    return this.adminService.compareTwoDays(date1, date2);
  }

  /**
   * So sánh doanh thu 2 tháng
   */
  @Get('compare-months')
  @ApiOperation({ summary: 'So sánh doanh thu 2 tháng' })
  @ApiResponse({
    status: 200,
    description: 'So sánh giữa 2 tháng',
    type: MonthComparisonDto,
  })
  async compareTwoMonths(
    @Query('month1') month1?: string,
    @Query('month2') month2?: string,
  ): Promise<MonthComparisonDto> {
    if (!month1 || !month2) {
      // Default to last month and current month
      const today = new Date();
      const lastMonth = new Date(today);
      lastMonth.setMonth(lastMonth.getMonth() - 1);

      const formatMonth = (d: Date) =>
        `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;

      return this.adminService.compareTwoMonths(
        formatMonth(lastMonth),
        formatMonth(today),
      );
    }
    return this.adminService.compareTwoMonths(month1, month2);
  }

  /**
   * Phân tích Năm trên Năm
   */
  @Get('year-over-year')
  @ApiOperation({ summary: 'Phân tích Năm trên Năm' })
  @ApiResponse({
    status: 200,
    description: 'So sánh năm trước và năm nay',
    type: YearOverYearDto,
  })
  async getYearOverYearAnalysis(): Promise<YearOverYearDto> {
    return this.adminService.getYearOverYearAnalysis();
  }

  /**
   * Lấy doanh thu theo giờ
   */
  @Get('hourly-revenue')
  @ApiOperation({ summary: 'Lấy doanh thu theo giờ' })
  @ApiResponse({
    status: 200,
    description: 'Doanh thu theo giờ',
    type: [HourlyRevenueDto],
  })
  async getHourlyRevenue(
    @Query('date') date?: string,
  ): Promise<HourlyRevenueDto[]> {
    return this.adminService.getHourlyRevenue(date);
  }

  /**
   * Lấy top products
   */
  @Get('top-products')
  @ApiOperation({ summary: 'Lấy top products (subscription plans)' })
  @ApiResponse({
    status: 200,
    description: 'Top products theo doanh thu',
    type: [TopProductsDto],
  })
  async getTopProducts(
    @Query('limit') limit?: string,
  ): Promise<TopProductsDto[]> {
    const limitNum = limit ? parseInt(limit, 10) : 10;
    return this.adminService.getTopProducts(limitNum);
  }

  /**
   * Lấy metrics người dùng
   */
  @Get('user-metrics')
  @ApiOperation({ summary: 'Lấy metrics người dùng chi tiết' })
  @ApiResponse({
    status: 200,
    description: 'Metrics người dùng',
    type: UserMetricsDto,
  })
  async getUserMetrics(): Promise<UserMetricsDto> {
    return this.adminService.getUserMetrics();
  }

  /**
   * Lấy metrics giao dịch
   */
  @Get('transaction-metrics')
  @ApiOperation({ summary: 'Lấy metrics giao dịch chi tiết' })
  @ApiResponse({
    status: 200,
    description: 'Metrics giao dịch',
    type: TransactionMetricsDto,
  })
  async getTransactionMetrics(): Promise<TransactionMetricsDto> {
    return this.adminService.getTransactionMetrics();
  }

  /**
   * Phân tích theo khoảng thời gian
   */
  @Get('date-range-analytics')
  @ApiOperation({ summary: 'Phân tích doanh thu theo khoảng thời gian' })
  @ApiResponse({
    status: 200,
    description: 'Analytics cho khoảng thời gian',
    type: DateRangeAnalyticsDto,
  })
  async analyzeDateRange(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ): Promise<DateRangeAnalyticsDto> {
    if (!startDate || !endDate) {
      // Default to last 30 days
      const today = new Date();
      const last30Days = new Date(today);
      last30Days.setDate(last30Days.getDate() - 30);

      const formatDate = (d: Date) =>
        `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

      return this.adminService.analyzeDateRange(
        formatDate(last30Days),
        formatDate(today),
      );
    }
    return this.adminService.analyzeDateRange(startDate, endDate);
  }

  /**
   * Lấy metrics trending
   */
  @Get('trending-metrics')
  @ApiOperation({
    summary: 'Lấy metrics trending (chi phí, người dùng, giao dịch)',
  })
  @ApiResponse({
    status: 200,
    description: 'Trending metrics',
    type: TrendingMetricsDto,
  })
  async getTrendingMetrics(
    @Query('metric') metric?: 'revenue' | 'users' | 'transactions',
  ): Promise<TrendingMetricsDto> {
    return this.adminService.getTrendingMetrics(metric || 'revenue');
  }

  /**
   * Lấy comprehensive dashboard (tất cả thông tin)
   */
  @Get('comprehensive')
  @ApiOperation({ summary: 'Lấy toàn bộ dashboard analytics' })
  @ApiResponse({
    status: 200,
    description: 'Comprehensive dashboard data',
    type: ComprehensiveDashboardDto,
  })
  async getComprehensiveDashboard(): Promise<ComprehensiveDashboardDto> {
    return this.adminService.getComprehensiveDashboard();
  }
}
