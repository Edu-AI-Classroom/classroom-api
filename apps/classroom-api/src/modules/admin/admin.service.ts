import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
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

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Lấy thống kê dashboard chính
   */
  async getDashboardStats(): Promise<DashboardStatsDto> {
    try {
      const prisma = this.prisma as any;

      // Tính tổng số người dùng
      const totalUsers = await prisma.uSER.count();

      // Tính tổng doanh thu (từ transaction với status COMPLETED)
      const revenueResult = await prisma.transaction.aggregate({
        where: { status: 'COMPLETED' },
        _sum: { amount: true },
      });
      const totalRevenue = revenueResult._sum?.amount || 0;

      // Tính tổng số giao dịch
      const totalTransactions = await prisma.transaction.count();

      // Tính số giao dịch đã hoàn thành
      const completedTransactions = await prisma.transaction.count({
        where: { status: 'COMPLETED' },
      });

      // Tính tổng số phòng học
      const totalClassrooms = await prisma.classroom.count();

      // Tính số subscription đang dùng (từ personal_info có sub_id)
      const activeSubscriptions = await prisma.personal_info.count({
        where: { sub_id: { not: null } },
      });

      return {
        totalUsers,
        totalRevenue: Number(totalRevenue),
        totalTransactions,
        completedTransactions,
        totalClassrooms,
        activeSubscriptions,
      };
    } catch (error) {
      this.logger.error(`Failed to get dashboard stats: ${error.message}`);
      throw error;
    }
  }

  /**
   * Lấy giao dịch gần đây nhất
   */
  async getRecentTransactions(limit = 10): Promise<RecentTransactionDto[]> {
    try {
      const prisma = this.prisma as any;

      const transactions = await prisma.transaction.findMany({
        take: limit,
        orderBy: { created_at: 'desc' },
        select: {
          transaction_id: true,
          user_id: true,
          amount: true,
          status: true,
          created_at: true,
          sub_code: true,
        },
      });

      return transactions.map((t) => ({
        transaction_id: t.transaction_id,
        user_id: t.user_id,
        amount: Number(t.amount),
        status: t.status,
        created_at: t.created_at,
        sub_code: t.sub_code,
      }));
    } catch (error) {
      this.logger.error(`Failed to get recent transactions: ${error.message}`);
      throw error;
    }
  }

  /**
   * Lấy người dùng mới tạo gần đây
   */
  async getRecentUsers(limit = 10): Promise<RecentUserDto[]> {
    try {
      const prisma = this.prisma as any;

      const users = await prisma.uSER.findMany({
        take: limit,
        orderBy: { created_at: 'desc' },
        select: {
          user_id: true,
          user_name: true,
          email: true,
          role: true,
          created_at: true,
        },
      });

      return users.map((u) => ({
        user_id: u.user_id,
        user_name: u.user_name,
        email: u.email,
        role: u.role || 'USER',
        created_at: u.created_at,
      }));
    } catch (error) {
      this.logger.error(`Failed to get recent users: ${error.message}`);
      throw error;
    }
  }

  /**
   * Lấy doanh thu theo tháng
   */
  async getMonthlyRevenue(monthsBack = 12): Promise<MonthlyRevenueDto[]> {
    try {
      const prisma = this.prisma as any;

      // Tính từ tháng trước đến hiện tại
      const today = new Date();
      const startDate = new Date(
        today.getFullYear(),
        today.getMonth() - monthsBack,
        1,
      );

      const transactions = await prisma.transaction.findMany({
        where: {
          status: 'COMPLETED',
          created_at: { gte: startDate },
        },
        select: {
          amount: true,
          created_at: true,
        },
      });

      // Nhóm theo tháng
      const monthlyData: { [key: string]: { revenue: number; count: number } } =
        {};

      transactions.forEach((t) => {
        const date = new Date(t.created_at);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

        if (!monthlyData[monthKey]) {
          monthlyData[monthKey] = { revenue: 0, count: 0 };
        }

        monthlyData[monthKey].revenue += Number(t.amount);
        monthlyData[monthKey].count += 1;
      });

      // Chuyển đổi thành mảng và sắp xếp
      const result = Object.entries(monthlyData)
        .map(([month, data]) => ({
          month,
          revenue: data.revenue,
          transactionCount: data.count,
        }))
        .sort((a, b) => a.month.localeCompare(b.month));

      return result;
    } catch (error) {
      this.logger.error(`Failed to get monthly revenue: ${error.message}`);
      throw error;
    }
  }

  /**
   * Lấy thống kê theo gói subscription
   */
  async getSubscriptionStats(): Promise<SubscriptionStatsDto[]> {
    try {
      const prisma = this.prisma as any;

      // Lấy danh sách subscription_plan, đếm user và tính doanh thu
      const subscriptions = await prisma.subscription_plan.findMany({
        where: { is_active: true },
        select: {
          sub_code: true,
          sub_name: true,
          sub_id: true,
        },
      });

      const result: SubscriptionStatsDto[] = [];

      for (const sub of subscriptions) {
        // Đếm số user có subscription này
        const userCount = await prisma.personal_info.count({
          where: { sub_id: sub.sub_id },
        });

        // Tính doanh thu từ transaction có sub_code này
        const revenueResult = await prisma.transaction.aggregate({
          where: {
            sub_code: sub.sub_code,
            status: 'COMPLETED',
          },
          _sum: { amount: true },
        });

        result.push({
          sub_code: sub.sub_code,
          sub_name: sub.sub_name,
          userCount,
          revenue: Number(revenueResult._sum?.amount || 0),
        });
      }

      return result.sort((a, b) => b.revenue - a.revenue);
    } catch (error) {
      this.logger.error(`Failed to get subscription stats: ${error.message}`);
      throw error;
    }
  }

  /**
   * Lấy số lượng user theo role
   */
  async getUsersByRole(): Promise<Array<{ role: string; count: number }>> {
    try {
      const prisma = this.prisma as any;

      const result = await prisma.uSER.groupBy({
        by: ['role'],
        _count: {
          user_id: true,
        },
      });

      return result.map((r) => ({
        role: r.role || 'USER',
        count: r._count.user_id,
      }));
    } catch (error) {
      this.logger.error(`Failed to get users by role: ${error.message}`);
      throw error;
    }
  }

  /**
   * Lấy số lượng transaction theo status
   */
  async getTransactionsByStatus(): Promise<
    Array<{ status: string; count: number }>
  > {
    try {
      const prisma = this.prisma as any;

      const result = await prisma.transaction.groupBy({
        by: ['status'],
        _count: {
          transaction_id: true,
        },
      });

      return result.map((r) => ({
        status: r.status || 'UNKNOWN',
        count: r._count.transaction_id,
      }));
    } catch (error) {
      this.logger.error(
        `Failed to get transactions by status: ${error.message}`,
      );
      throw error;
    }
  }

  /**
   * Lấy tăng trưởng user theo tháng
   */
  async getUserGrowth(monthsBack = 12): Promise<UserGrowthDto[]> {
    try {
      const prisma = this.prisma as any;

      const today = new Date();
      const startDate = new Date(
        today.getFullYear(),
        today.getMonth() - monthsBack,
        1,
      );

      const users = await prisma.uSER.findMany({
        where: {
          created_at: { gte: startDate },
        },
        select: {
          created_at: true,
        },
        orderBy: { created_at: 'asc' },
      });

      // Group by month
      const monthlyData: { [key: string]: number } = {};
      users.forEach((u) => {
        const date = new Date(u.created_at);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        monthlyData[monthKey] = (monthlyData[monthKey] || 0) + 1;
      });

      // Calculate cumulative total
      const result: UserGrowthDto[] = [];
      let cumulativeTotal = 0;

      Object.entries(monthlyData)
        .sort(([keyA], [keyB]) => keyA.localeCompare(keyB))
        .forEach(([month, newUsers]) => {
          cumulativeTotal += newUsers;
          result.push({
            month,
            newUsers,
            totalUsers: cumulativeTotal,
          });
        });

      return result;
    } catch (error) {
      this.logger.error(`Failed to get user growth: ${error.message}`);
      throw error;
    }
  }

  /**
   * Lấy tất cả giao dịch (admin)
   */
  async getAllTransactions(
    limit = 10,
    offset = 0,
  ): Promise<RecentTransactionDto[]> {
    try {
      const prisma = this.prisma as any;

      const transactions = await prisma.transaction.findMany({
        take: limit,
        skip: offset,
        orderBy: { created_at: 'desc' },
        select: {
          transaction_id: true,
          user_id: true,
          amount: true,
          status: true,
          created_at: true,
          sub_code: true,
        },
      });

      return transactions.map((t) => ({
        transaction_id: t.transaction_id,
        user_id: t.user_id,
        amount: Number(t.amount),
        status: t.status,
        created_at: t.created_at,
        sub_code: t.sub_code,
      }));
    } catch (error) {
      this.logger.error(`Failed to get all transactions: ${error.message}`);
      throw error;
    }
  }

  /**
   * Lấy chi tiết giao dịch
   */
  async getTransactionDetail(transactionId: number): Promise<any> {
    try {
      const prisma = this.prisma as any;

      const transaction = await prisma.transaction.findUnique({
        where: { transaction_id: transactionId },
        select: {
          transaction_id: true,
          user_id: true,
          amount: true,
          status: true,
          created_at: true,
          updated_at: true,
          sub_code: true,
          order_code: true,
          reason: true,
        },
      });

      if (!transaction) {
        throw new Error('Transaction not found');
      }

      return {
        transaction_id: transaction.transaction_id,
        user_id: transaction.user_id,
        amount: Number(transaction.amount),
        status: transaction.status,
        created_at: transaction.created_at,
        updated_at: transaction.updated_at,
        sub_code: transaction.sub_code,
        order_code: transaction.order_code,
        reason: transaction.reason,
      };
    } catch (error) {
      this.logger.error(`Failed to get transaction detail: ${error.message}`);
      throw error;
    }
  }

  /**
   * Hủy giao dịch (admin)
   */
  async cancelTransaction(
    transactionId: number,
    reason?: string,
  ): Promise<any> {
    try {
      const prisma = this.prisma as any;

      const transaction = await prisma.transaction.update({
        where: { transaction_id: transactionId },
        data: {
          status: 'CANCELLED',
          reason: reason || 'Cancelled by admin',
          updated_at: new Date(),
        },
        select: {
          transaction_id: true,
          status: true,
          updated_at: true,
        },
      });

      return transaction;
    } catch (error) {
      this.logger.error(`Failed to cancel transaction: ${error.message}`);
      throw error;
    }
  }

  // ==================== ADVANCED ANALYTICS METHODS ====================

  /**
   * Lấy doanh thu theo ngày
   */
  async getDailyRevenue(daysBack = 30): Promise<DailyRevenueDto[]> {
    try {
      const prisma = this.prisma as any;
      const today = new Date();
      const startDate = new Date(today);
      startDate.setDate(startDate.getDate() - daysBack);
      startDate.setHours(0, 0, 0, 0);

      const transactions = await prisma.transaction.findMany({
        where: {
          status: 'COMPLETED',
          created_at: { gte: startDate, lte: today },
        },
        select: {
          amount: true,
          created_at: true,
        },
      });

      // Group by day
      const dailyData: {
        [key: string]: { revenue: number; count: number; hours: Set<number> };
      } = {};

      transactions.forEach((t) => {
        const date = new Date(t.created_at);
        const dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

        if (!dailyData[dateKey]) {
          dailyData[dateKey] = { revenue: 0, count: 0, hours: new Set() };
        }

        dailyData[dateKey].revenue += Number(t.amount);
        dailyData[dateKey].count += 1;
        dailyData[dateKey].hours.add(date.getHours());
      });

      // Convert to array and sort
      const result = Object.entries(dailyData)
        .map(([date, data]) => ({
          date,
          revenue: data.revenue,
          transactionCount: data.count,
          peakHour:
            Array.from(data.hours).length > 0
              ? Math.max(...Array.from(data.hours))
              : undefined,
        }))
        .sort((a, b) => a.date.localeCompare(b.date));

      return result;
    } catch (error) {
      this.logger.error(`Failed to get daily revenue: ${error.message}`);
      throw error;
    }
  }

  /**
   * So sánh doanh thu 2 ngày
   */
  async compareTwoDays(
    date1: string,
    date2: string,
  ): Promise<DailyComparisonDto> {
    try {
      const prisma = this.prisma as any;

      const getDateStats = async (dateStr: string) => {
        const [year, month, day] = dateStr.split('-').map(Number);
        const startDate = new Date(year, month - 1, day, 0, 0, 0);
        const endDate = new Date(year, month - 1, day, 23, 59, 59);

        const result = await prisma.transaction.aggregate({
          where: {
            status: 'COMPLETED',
            created_at: { gte: startDate, lte: endDate },
          },
          _sum: { amount: true },
          _count: { transaction_id: true },
        });

        return {
          revenue: Number(result._sum?.amount || 0),
          count: result._count,
        };
      };

      const stats1 = await getDateStats(date1);
      const stats2 = await getDateStats(date2);

      const revenueChangePercent =
        stats1.revenue !== 0
          ? ((stats2.revenue - stats1.revenue) / stats1.revenue) * 100
          : 0;
      const transactionChangePercent =
        stats1.count !== 0
          ? ((stats2.count - stats1.count) / stats1.count) * 100
          : 0;

      return {
        date1,
        revenue1: stats1.revenue,
        transactions1: stats1.count,
        date2,
        revenue2: stats2.revenue,
        transactions2: stats2.count,
        revenueChangePercent,
        transactionChangePercent,
      };
    } catch (error) {
      this.logger.error(`Failed to compare days: ${error.message}`);
      throw error;
    }
  }

  /**
   * So sánh doanh thu 2 tháng
   */
  async compareTwoMonths(
    month1: string,
    month2: string,
  ): Promise<MonthComparisonDto> {
    try {
      const prisma = this.prisma as any;

      const getMonthStats = async (monthStr: string) => {
        const [year, month] = monthStr.split('-').map(Number);
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0, 23, 59, 59);

        const transactionResult = await prisma.transaction.aggregate({
          where: {
            status: 'COMPLETED',
            created_at: { gte: startDate, lte: endDate },
          },
          _sum: { amount: true },
          _count: { transaction_id: true },
        });

        const newUsersResult = await prisma.uSER.count({
          where: {
            created_at: { gte: startDate, lte: endDate },
          },
        });

        return {
          revenue: Number(transactionResult._sum?.amount || 0),
          transactions: transactionResult._count,
          newUsers: newUsersResult,
        };
      };

      const stats1 = await getMonthStats(month1);
      const stats2 = await getMonthStats(month2);

      const revenueChangePercent =
        stats1.revenue !== 0
          ? ((stats2.revenue - stats1.revenue) / stats1.revenue) * 100
          : 0;
      const userGrowthPercent =
        stats1.newUsers !== 0
          ? ((stats2.newUsers - stats1.newUsers) / stats1.newUsers) * 100
          : 0;

      return {
        month1,
        revenue1: stats1.revenue,
        transactions1: stats1.transactions,
        newUsers1: stats1.newUsers,
        month2,
        revenue2: stats2.revenue,
        transactions2: stats2.transactions,
        newUsers2: stats2.newUsers,
        revenueChangePercent,
        userGrowthPercent,
      };
    } catch (error) {
      this.logger.error(`Failed to compare months: ${error.message}`);
      throw error;
    }
  }

  /**
   * Phân tích Năm trên Năm
   */
  async getYearOverYearAnalysis(): Promise<YearOverYearDto> {
    try {
      const prisma = this.prisma as any;
      const today = new Date();
      const currentYear = today.getFullYear();

      const getYearStats = async (year: number) => {
        const startDate = new Date(year, 0, 1);
        const endDate = new Date(year, 11, 31, 23, 59, 59);

        const transactionResult = await prisma.transaction.aggregate({
          where: {
            status: 'COMPLETED',
            created_at: { gte: startDate, lte: endDate },
          },
          _sum: { amount: true },
          _count: { transaction_id: true },
        });

        const newUsersResult = await prisma.uSER.count({
          where: {
            created_at: { gte: startDate, lte: endDate },
          },
        });

        return {
          revenue: Number(transactionResult._sum?.amount || 0),
          transactions: transactionResult._count,
          newUsers: newUsersResult,
        };
      };

      const lastYear = currentYear - 1;
      const stats1 = await getYearStats(lastYear);
      const stats2 = await getYearStats(currentYear);

      const revenueChangePercent =
        stats1.revenue !== 0
          ? ((stats2.revenue - stats1.revenue) / stats1.revenue) * 100
          : 0;
      const userGrowthPercent =
        stats1.newUsers !== 0
          ? ((stats2.newUsers - stats1.newUsers) / stats1.newUsers) * 100
          : 0;

      return {
        year1: lastYear,
        revenue1: stats1.revenue,
        transactions1: stats1.transactions,
        newUsers1: stats1.newUsers,
        year2: currentYear,
        revenue2: stats2.revenue,
        transactions2: stats2.transactions,
        newUsers2: stats2.newUsers,
        revenueChangePercent,
        userGrowthPercent,
      };
    } catch (error) {
      this.logger.error(
        `Failed to get year over year analysis: ${error.message}`,
      );
      throw error;
    }
  }

  /**
   * Lấy doanh thu theo giờ
   */
  async getHourlyRevenue(date?: string): Promise<HourlyRevenueDto[]> {
    try {
      const prisma = this.prisma as any;
      let startDate: Date;
      let endDate: Date;

      if (date) {
        const [year, month, day] = date.split('-').map(Number);
        startDate = new Date(year, month - 1, day, 0, 0, 0);
        endDate = new Date(year, month - 1, day, 23, 59, 59);
      } else {
        const today = new Date();
        startDate = new Date(today);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(today);
        endDate.setHours(23, 59, 59, 999);
      }

      const transactions = await prisma.transaction.findMany({
        where: {
          status: 'COMPLETED',
          created_at: { gte: startDate, lte: endDate },
        },
        select: {
          amount: true,
          created_at: true,
        },
      });

      // Group by hour
      const hourlyData: {
        [key: number]: { revenue: number; count: number; amounts: number[] };
      } = {};

      for (let i = 0; i < 24; i++) {
        hourlyData[i] = { revenue: 0, count: 0, amounts: [] };
      }

      transactions.forEach((t) => {
        const hour = new Date(t.created_at).getHours();
        hourlyData[hour].revenue += Number(t.amount);
        hourlyData[hour].count += 1;
        hourlyData[hour].amounts.push(Number(t.amount));
      });

      // Convert to array
      const result = Object.entries(hourlyData)
        .map(([hour, data]) => ({
          hour: Number(hour),
          revenue: data.revenue,
          transactionCount: data.count,
          averageTransactionValue:
            data.count > 0
              ? data.amounts.reduce((a, b) => a + b, 0) / data.count
              : 0,
        }))
        .sort((a, b) => a.hour - b.hour);

      return result;
    } catch (error) {
      this.logger.error(`Failed to get hourly revenue: ${error.message}`);
      throw error;
    }
  }

  /**
   * Lấy top products (subscription plans)
   */
  async getTopProducts(limit = 10): Promise<TopProductsDto[]> {
    try {
      const prisma = this.prisma as any;

      const transactions = await prisma.transaction.findMany({
        where: { status: 'COMPLETED' },
        select: {
          amount: true,
          sub_code: true,
        },
      });

      // Group by subscription
      const subData: {
        [key: string]: { revenue: number; count: number; sub_name?: string };
      } = {};

      const subscriptions = await prisma.subscription_plan.findMany({
        select: {
          sub_code: true,
          sub_name: true,
        },
      });

      const subMap = new Map(
        subscriptions.map((s) => [s.sub_code, s.sub_name]),
      );

      transactions.forEach((t) => {
        const subCode = t.sub_code || 'UNKNOWN';
        if (!subData[subCode]) {
          subData[subCode] = {
            revenue: 0,
            count: 0,
            sub_name: (subMap.get(subCode) as string) || 'Unknown',
          };
        }
        subData[subCode].revenue += Number(t.amount);
        subData[subCode].count += 1;
      });

      const totalRevenue = Object.values(subData).reduce(
        (sum, item) => sum + item.revenue,
        0,
      );

      const result = Object.entries(subData)
        .map(([sub_code, data]) => ({
          sub_code,
          sub_name: data.sub_name || 'Unknown',
          soldCount: data.count,
          totalRevenue: data.revenue,
          avgRevenue: data.count > 0 ? data.revenue / data.count : 0,
          percentage:
            totalRevenue > 0 ? (data.revenue / totalRevenue) * 100 : 0,
        }))
        .sort((a, b) => b.totalRevenue - a.totalRevenue)
        .slice(0, limit);

      return result;
    } catch (error) {
      this.logger.error(`Failed to get top products: ${error.message}`);
      throw error;
    }
  }

  /**
   * Lấy metrics người dùng
   */
  async getUserMetrics(): Promise<UserMetricsDto> {
    try {
      const prisma = this.prisma as any;
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const lastWeek = new Date(today);
      lastWeek.setDate(lastWeek.getDate() - 7);

      const lastMonth = new Date(today);
      lastMonth.setMonth(lastMonth.getMonth() - 1);

      // Total users
      const totalUsers = await prisma.uSER.count();

      // New users today
      const newUsersToday = await prisma.uSER.count({
        where: {
          created_at: { gte: today },
        },
      });

      // New users this week
      const newUsersThisWeek = await prisma.uSER.count({
        where: {
          created_at: { gte: lastWeek },
        },
      });

      // New users this month
      const newUsersThisMonth = await prisma.uSER.count({
        where: {
          created_at: { gte: lastMonth },
        },
      });

      // Active users today (users with transactions today)
      const activeUsersToday = await prisma.transaction.findMany({
        where: {
          created_at: { gte: today },
        },
        distinct: ['user_id'],
      });

      // Conversion rate (users with subscription / total users)
      const usersWithSubscription = await prisma.personal_info.count({
        where: { sub_id: { not: null } },
      });

      const conversionRate =
        totalUsers > 0 ? (usersWithSubscription / totalUsers) * 100 : 0;

      // Retention rate (estimate: users with transactions in last 30 days / total users)
      const last30Days = new Date(today);
      last30Days.setDate(last30Days.getDate() - 30);

      const activeUsersLast30Days = await prisma.transaction.findMany({
        where: {
          created_at: { gte: last30Days },
        },
        distinct: ['user_id'],
      });

      const retentionRate =
        totalUsers > 0 ? (activeUsersLast30Days.length / totalUsers) * 100 : 0;

      return {
        totalUsers,
        newUsersToday,
        newUsersThisWeek,
        newUsersThisMonth,
        activeUsersToday: activeUsersToday.length,
        conversionRate: Number(conversionRate.toFixed(2)),
        retentionRate: Number(retentionRate.toFixed(2)),
      };
    } catch (error) {
      this.logger.error(`Failed to get user metrics: ${error.message}`);
      throw error;
    }
  }

  /**
   * Lấy metrics giao dịch
   */
  async getTransactionMetrics(): Promise<TransactionMetricsDto> {
    try {
      const prisma = this.prisma as any;

      // Total transactions
      const totalTransactions = await prisma.transaction.count();

      // Completed transactions
      const completedTransactions = await prisma.transaction.count({
        where: { status: 'COMPLETED' },
      });

      // Failed transactions
      const failedTransactions = await prisma.transaction.count({
        where: { status: 'FAILED' },
      });

      // Success rate
      const successRate =
        totalTransactions > 0
          ? (completedTransactions / totalTransactions) * 100
          : 0;

      // Average transaction value
      const avgResult = await prisma.transaction.aggregate({
        _avg: { amount: true },
      });

      const avgTransactionValue = Number(avgResult._avg?.amount || 0);

      // Max transaction value
      const maxResult = await prisma.transaction.aggregate({
        _max: { amount: true },
      });

      const maxTransactionValue = Number(maxResult._max?.amount || 0);

      // Min transaction value
      const minResult = await prisma.transaction.aggregate({
        _min: { amount: true },
        where: { amount: { gt: 0 } },
      });

      const minTransactionValue = Number(minResult._min?.amount || 0);

      return {
        totalTransactions,
        completedTransactions,
        failedTransactions,
        successRate: Number(successRate.toFixed(2)),
        avgTransactionValue: Number(avgTransactionValue.toFixed(2)),
        maxTransactionValue,
        minTransactionValue,
      };
    } catch (error) {
      this.logger.error(`Failed to get transaction metrics: ${error.message}`);
      throw error;
    }
  }

  /**
   * Phân tích theo khoảng thời gian
   */
  async analyzeDateRange(
    startDate: string,
    endDate: string,
  ): Promise<DateRangeAnalyticsDto> {
    try {
      const prisma = this.prisma as any;

      const [startYear, startMonth, startDay] = startDate
        .split('-')
        .map(Number);
      const [endYear, endMonth, endDay] = endDate.split('-').map(Number);

      const dateStart = new Date(startYear, startMonth - 1, startDay, 0, 0, 0);
      const dateEnd = new Date(endYear, endMonth - 1, endDay, 23, 59, 59);

      // Get transactions
      const transactions = await prisma.transaction.findMany({
        where: {
          status: 'COMPLETED',
          created_at: { gte: dateStart, lte: dateEnd },
        },
        select: {
          amount: true,
          created_at: true,
        },
      });

      // Get new users
      const newUsers = await prisma.uSER.count({
        where: {
          created_at: { gte: dateStart, lte: dateEnd },
        },
      });

      // Calculate totals
      const totalRevenue = transactions.reduce(
        (sum, t) => sum + Number(t.amount),
        0,
      );
      const totalTransactions = transactions.length;

      // Calculate days in range
      const daysInRange = Math.ceil(
        (dateEnd.getTime() - dateStart.getTime()) / (1000 * 60 * 60 * 24) + 1,
      );

      // Get daily breakdown
      const dailyData: { [key: string]: { revenue: number; count: number } } =
        {};

      transactions.forEach((t) => {
        const date = new Date(t.created_at);
        const dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

        if (!dailyData[dateKey]) {
          dailyData[dateKey] = { revenue: 0, count: 0 };
        }

        dailyData[dateKey].revenue += Number(t.amount);
        dailyData[dateKey].count += 1;
      });

      const dailyBreakdown = Object.entries(dailyData)
        .map(([date, data]) => ({
          date,
          revenue: data.revenue,
          transactionCount: data.count,
        }))
        .sort((a, b) => a.date.localeCompare(b.date));

      return {
        startDate,
        endDate,
        totalRevenue,
        totalTransactions,
        newUsers,
        avgDailyRevenue: Number((totalRevenue / daysInRange).toFixed(2)),
        avgDailyTransactions: Number(
          (totalTransactions / daysInRange).toFixed(2),
        ),
        dailyBreakdown,
      };
    } catch (error) {
      this.logger.error(`Failed to analyze date range: ${error.message}`);
      throw error;
    }
  }

  /**
   * Lấy các metrics trending
   */
  async getTrendingMetrics(
    metric: 'revenue' | 'users' | 'transactions' = 'revenue',
  ): Promise<TrendingMetricsDto> {
    try {
      const prisma = this.prisma as any;
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const last7 = new Date(today);
      last7.setDate(last7.getDate() - 7);

      const last14 = new Date(today);
      last14.setDate(last14.getDate() - 14);

      const last30 = new Date(today);
      last30.setDate(last30.getDate() - 30);

      const previous7 = new Date(last7);
      previous7.setDate(previous7.getDate() - 7);

      const getLast7DaysMetric = async (startDate: Date): Promise<number> => {
        if (metric === 'revenue') {
          const result = await prisma.transaction.aggregate({
            where: {
              status: 'COMPLETED',
              created_at: { gte: startDate, lte: today },
            },
            _sum: { amount: true },
          });
          return Number(result._sum?.amount || 0);
        } else if (metric === 'users') {
          return await prisma.uSER.count({
            where: {
              created_at: { gte: startDate, lte: today },
            },
          });
        } else {
          return await prisma.transaction.count({
            where: {
              created_at: { gte: startDate, lte: today },
            },
          });
        }
      };

      const last7Days = await getLast7DaysMetric(last7);
      const last14Days = await getLast7DaysMetric(last14);
      const last30Days = await getLast7DaysMetric(last30);
      const previous7Days = await getLast7DaysMetric(previous7);

      const changePercent =
        previous7Days > 0
          ? ((last7Days - previous7Days) / previous7Days) * 100
          : 0;

      // Determine trend
      let trend: 'UP' | 'DOWN' | 'STABLE' = 'STABLE';
      if (changePercent > 5) trend = 'UP';
      else if (changePercent < -5) trend = 'DOWN';

      return {
        last7Days,
        last14Days,
        last30Days,
        trend,
        changePercent: Number(changePercent.toFixed(2)),
      };
    } catch (error) {
      this.logger.error(`Failed to get trending metrics: ${error.message}`);
      throw error;
    }
  }

  /**
   * Lấy comprehensive dashboard
   */
  async getComprehensiveDashboard(): Promise<ComprehensiveDashboardDto> {
    try {
      const [
        overview,
        userMetrics,
        transactionMetrics,
        monthlyRevenue,
        topProducts,
        recentTransactions,
        recentUsers,
      ] = await Promise.all([
        this.getDashboardStats(),
        this.getUserMetrics(),
        this.getTransactionMetrics(),
        this.getMonthlyRevenue(12),
        this.getTopProducts(5),
        this.getRecentTransactions(10),
        this.getRecentUsers(10),
      ]);

      return {
        overview,
        userMetrics,
        transactionMetrics,
        monthlyRevenue,
        topProducts,
        recentTransactions,
        recentUsers,
      };
    } catch (error) {
      this.logger.error(
        `Failed to get comprehensive dashboard: ${error.message}`,
      );
      throw error;
    }
  }
}
