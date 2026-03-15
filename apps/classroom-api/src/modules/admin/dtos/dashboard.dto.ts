import { ApiProperty } from '@nestjs/swagger';

export class DashboardStatsDto {
  @ApiProperty({ description: 'Tổng số người dùng' })
  totalUsers: number;

  @ApiProperty({ description: 'Tổng doanh thu' })
  totalRevenue: number;

  @ApiProperty({ description: 'Tổng số giao dịch' })
  totalTransactions: number;

  @ApiProperty({ description: 'Số giao dịch đã hoàn thành' })
  completedTransactions: number;

  @ApiProperty({ description: 'Tổng số phòng học' })
  totalClassrooms: number;

  @ApiProperty({ description: 'Tổng số gói subscription đang dùng' })
  activeSubscriptions: number;
}

export class RecentTransactionDto {
  @ApiProperty()
  transaction_id: number;

  @ApiProperty()
  user_id: number;

  @ApiProperty()
  amount: number;

  @ApiProperty()
  status: string;

  @ApiProperty()
  created_at: Date;

  @ApiProperty({ required: false })
  sub_code?: string;
}

export class RecentUserDto {
  @ApiProperty()
  user_id: number;

  @ApiProperty()
  user_name: string;

  @ApiProperty()
  email: string;

  @ApiProperty()
  role: string;

  @ApiProperty()
  created_at: Date;
}

export class MonthlyRevenueDto {
  @ApiProperty({ description: 'Tháng (YYYY-MM)' })
  month: string;

  @ApiProperty({ description: 'Doanh thu' })
  revenue: number;

  @ApiProperty({ description: 'Số giao dịch' })
  transactionCount: number;
}

export class SubscriptionStatsDto {
  @ApiProperty({ description: 'Mã gói' })
  sub_code: string;

  @ApiProperty({ description: 'Tên gói' })
  sub_name: string;

  @ApiProperty({ description: 'Số lượng người dùng' })
  userCount: number;

  @ApiProperty({ description: 'Doanh thu' })
  revenue: number;
}

export class UserGrowthDto {
  @ApiProperty({ description: 'Tháng (YYYY-MM)' })
  month: string;

  @ApiProperty({ description: 'Số lượng user được tạo' })
  newUsers: number;

  @ApiProperty({ description: 'Tổng số user tích lũy' })
  totalUsers: number;
}

// ==================== Advanced Analytics DTOs ====================

export class DailyRevenueDto {
  @ApiProperty({ description: 'Ngày (YYYY-MM-DD)' })
  date: string;

  @ApiProperty({ description: 'Doanh thu' })
  revenue: number;

  @ApiProperty({ description: 'Số giao dịch' })
  transactionCount: number;

  @ApiProperty({ description: 'Giờ cao điểm (0-23)' })
  peakHour?: number;
}

export class DailyComparisonDto {
  @ApiProperty({ description: 'Ngày so sánh 1 (YYYY-MM-DD)' })
  date1: string;

  @ApiProperty({ description: 'Doanh thu ngày 1' })
  revenue1: number;

  @ApiProperty({ description: 'Số giao dịch ngày 1' })
  transactions1: number;

  @ApiProperty({ description: 'Ngày so sánh 2 (YYYY-MM-DD)' })
  date2: string;

  @ApiProperty({ description: 'Doanh thu ngày 2' })
  revenue2: number;

  @ApiProperty({ description: 'Số giao dịch ngày 2' })
  transactions2: number;

  @ApiProperty({ description: 'Phần trăm chênh lệch doanh thu' })
  revenueChangePercent: number;

  @ApiProperty({ description: 'Phần trăm chênh lệch giao dịch' })
  transactionChangePercent: number;
}

export class MonthComparisonDto {
  @ApiProperty({ description: 'Tháng so sánh 1 (YYYY-MM)' })
  month1: string;

  @ApiProperty({ description: 'Doanh thu tháng 1' })
  revenue1: number;

  @ApiProperty({ description: 'Số giao dịch tháng 1' })
  transactions1: number;

  @ApiProperty({ description: 'Số user mới' })
  newUsers1: number;

  @ApiProperty({ description: 'Tháng so sánh 2 (YYYY-MM)' })
  month2: string;

  @ApiProperty({ description: 'Doanh thu tháng 2' })
  revenue2: number;

  @ApiProperty({ description: 'Số giao dịch tháng 2' })
  transactions2: number;

  @ApiProperty({ description: 'Số user mới' })
  newUsers2: number;

  @ApiProperty({ description: 'Phần trăm chênh lệch doanh thu' })
  revenueChangePercent: number;

  @ApiProperty({ description: 'Phần trăm chênh lệch user mới' })
  userGrowthPercent: number;
}

export class YearOverYearDto {
  @ApiProperty({ description: 'Năm 1' })
  year1: number;

  @ApiProperty({ description: 'Doanh thu năm 1' })
  revenue1: number;

  @ApiProperty({ description: 'Số giao dịch năm 1' })
  transactions1: number;

  @ApiProperty({ description: 'Số user mới năm 1' })
  newUsers1: number;

  @ApiProperty({ description: 'Năm 2' })
  year2: number;

  @ApiProperty({ description: 'Doanh thu năm 2' })
  revenue2: number;

  @ApiProperty({ description: 'Số giao dịch năm 2' })
  transactions2: number;

  @ApiProperty({ description: 'Số user mới năm 2' })
  newUsers2: number;

  @ApiProperty({ description: 'Phần trăm chênh lệch doanh thu' })
  revenueChangePercent: number;

  @ApiProperty({ description: 'Phần trăm chênh lệch user mới' })
  userGrowthPercent: number;
}

export class HourlyRevenueDto {
  @ApiProperty({ description: 'Giờ (0-23)' })
  hour: number;

  @ApiProperty({ description: 'Doanh thu' })
  revenue: number;

  @ApiProperty({ description: 'Số giao dịch' })
  transactionCount: number;

  @ApiProperty({ description: 'Trung bình giá trị giao dịch' })
  averageTransactionValue: number;
}

export class TopProductsDto {
  @ApiProperty({ description: 'Mã gói subscription' })
  sub_code: string;

  @ApiProperty({ description: 'Tên gói' })
  sub_name: string;

  @ApiProperty({ description: 'Số lượng bán' })
  soldCount: number;

  @ApiProperty({ description: 'Tổng doanh thu' })
  totalRevenue: number;

  @ApiProperty({ description: 'Doanh thu trung bình' })
  avgRevenue: number;

  @ApiProperty({ description: 'Tỉ lệ phần trăm' })
  percentage: number;
}

export class UserMetricsDto {
  @ApiProperty({ description: 'Tổng số user' })
  totalUsers: number;

  @ApiProperty({ description: 'User mới hôm nay' })
  newUsersToday: number;

  @ApiProperty({ description: 'User mới tuần này' })
  newUsersThisWeek: number;

  @ApiProperty({ description: 'User mới tháng này' })
  newUsersThisMonth: number;

  @ApiProperty({ description: 'User hoạt động hôm nay' })
  activeUsersToday: number;

  @ApiProperty({ description: 'Tỉ lệ chuyên đổi (%)' })
  conversionRate: number;

  @ApiProperty({ description: 'Tỉ lệ giữ chân user (%)' })
  retentionRate: number;
}

export class TransactionMetricsDto {
  @ApiProperty({ description: 'Tổng giao dịch' })
  totalTransactions: number;

  @ApiProperty({ description: 'Giao dịch thành công' })
  completedTransactions: number;

  @ApiProperty({ description: 'Giao dịch thất bại' })
  failedTransactions: number;

  @ApiProperty({ description: 'Tỉ lệ thành công (%)' })
  successRate: number;

  @ApiProperty({ description: 'Giá trị giao dịch trung bình' })
  avgTransactionValue: number;

  @ApiProperty({ description: 'Giá trị giao dịch lớn nhất' })
  maxTransactionValue: number;

  @ApiProperty({ description: 'Giá trị giao dịch nhỏ nhất' })
  minTransactionValue: number;
}

export class DateRangeAnalyticsDto {
  @ApiProperty({ description: 'Ngày bắt đầu (YYYY-MM-DD)' })
  startDate: string;

  @ApiProperty({ description: 'Ngày kết thúc (YYYY-MM-DD)' })
  endDate: string;

  @ApiProperty({ description: 'Tổng doanh thu' })
  totalRevenue: number;

  @ApiProperty({ description: 'Tổng giao dịch' })
  totalTransactions: number;

  @ApiProperty({ description: 'User mới' })
  newUsers: number;

  @ApiProperty({ description: 'Doanh thu trung bình/ngày' })
  avgDailyRevenue: number;

  @ApiProperty({ description: 'Giao dịch trung bình/ngày' })
  avgDailyTransactions: number;

  @ApiProperty({ description: 'Chi tiết theo ngày', type: [DailyRevenueDto] })
  dailyBreakdown: DailyRevenueDto[];
}

export class TrendingMetricsDto {
  @ApiProperty({ description: '7 ngày trước' })
  last7Days: number;

  @ApiProperty({ description: '14 ngày trước' })
  last14Days: number;

  @ApiProperty({ description: '30 ngày trước' })
  last30Days: number;

  @ApiProperty({ description: 'Xu hướng (tăng/giảm)' })
  trend: 'UP' | 'DOWN' | 'STABLE';

  @ApiProperty({ description: 'Phần trăm thay đổi' })
  changePercent: number;
}

export class ComprehensiveDashboardDto {
  @ApiProperty({ type: DashboardStatsDto })
  overview: DashboardStatsDto;

  @ApiProperty({ type: UserMetricsDto })
  userMetrics: UserMetricsDto;

  @ApiProperty({ type: TransactionMetricsDto })
  transactionMetrics: TransactionMetricsDto;

  @ApiProperty({ type: [MonthlyRevenueDto] })
  monthlyRevenue: MonthlyRevenueDto[];

  @ApiProperty({ type: [TopProductsDto] })
  topProducts: TopProductsDto[];

  @ApiProperty({ type: [RecentTransactionDto] })
  recentTransactions: RecentTransactionDto[];

  @ApiProperty({ type: [RecentUserDto] })
  recentUsers: RecentUserDto[];
}
