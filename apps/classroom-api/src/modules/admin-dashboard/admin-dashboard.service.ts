import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../infrastructure/prisma/prisma.service';

type DateMode = 'range' | 'month' | 'year' | 'quarter' | 'day';

export interface AdminDateFilters {
  mode?: DateMode;
  month?: number;
  year?: number;
  quarter?: number;
  day?: string; // YYYY-MM-DD
  from?: string;
  to?: string;
}

@Injectable()
export class AdminDashboardService {
  constructor(private readonly prisma: PrismaService) {}

  resolveRange(query: AdminDateFilters) {
    const now = new Date();
    const mode: DateMode = (query.mode as DateMode) ?? 'month';

    const rawMonth = Number(query.month);
    const rawYear = Number(query.year);
    const rawQuarter = Number(query.quarter);

    const month =
      Number.isFinite(rawMonth) && rawMonth >= 1 && rawMonth <= 12
        ? rawMonth
        : now.getMonth() + 1;

    const year =
      Number.isFinite(rawYear) && rawYear >= 2000 && rawYear <= 9999
        ? rawYear
        : now.getFullYear();

    const quarter =
      Number.isFinite(rawQuarter) && rawQuarter >= 1 && rawQuarter <= 4
        ? rawQuarter
        : Math.floor(now.getMonth() / 3) + 1;

    let from: Date;
    let to: Date;

    if (mode === 'year') {
      from = new Date(year, 0, 1);
      to = new Date(year + 1, 0, 1);
    } else if (mode === 'quarter') {
      from = new Date(year, (quarter - 1) * 3, 1);
      to = new Date(year, quarter * 3, 1);
    } else if (mode === 'day') {
      const d = query.day ? new Date(query.day) : new Date();
      from = new Date(d.getFullYear(), d.getMonth(), d.getDate());
      to = new Date(from.getTime() + 24 * 60 * 60 * 1000);
    } else if (mode === 'range' && query.from && query.to) {
      const fromDate = new Date(query.from);
      const toDate = new Date(query.to);

      if (!isNaN(fromDate.getTime()) && !isNaN(toDate.getTime())) {
        from = fromDate;
        // make "to" inclusive by adding 1 day
        to = new Date(toDate.getTime() + 24 * 60 * 60 * 1000);
      } else {
        from = new Date(year, month - 1, 1);
        to = new Date(year, month, 1);
      }
    } else {
      from = new Date(year, month - 1, 1);
      to = new Date(year, month, 1);
    }

    return { from, to };
  }

  private growth(current: number, previous: number) {
    if (!previous) return 0;
    return ((current - previous) / previous) * 100;
  }

  async getOverview(filters: AdminDateFilters) {
    const { from, to } = this.resolveRange(filters);

    const [
      totalUsers,
      totalTeachers,
      totalStudents,
      totalClassrooms,
      revenueAgg,
      txCount,
    ] = await Promise.all([
      this.prisma.uSER.count(),
      this.prisma.uSER.count({ where: { role: 'TEACHER' } }),
      this.prisma.uSER.count({ where: { role: 'STUDENT' } }),
      this.prisma.classroom.count({ where: { is_deleted: false } }),
      this.prisma.transaction.aggregate({
        _sum: { amount: true },
        where: { status: 'SUCCESS', created_at: { gte: from, lt: to } },
      }),
      this.prisma.transaction.count({
        where: { created_at: { gte: from, lt: to } },
      }),
    ]);

    const windowMs = to.getTime() - from.getTime();
    const prevFrom = new Date(from.getTime() - windowMs);
    const prevTo = from;

    const [
      prevUsers,
      prevTeachers,
      prevStudents,
      prevClassrooms,
      prevRevenueAgg,
      prevTxCount,
    ] = await Promise.all([
      this.prisma.uSER.count({
        where: { created_at: { gte: prevFrom, lt: prevTo } },
      }),
      this.prisma.uSER.count({
        where: { role: 'TEACHER', created_at: { gte: prevFrom, lt: prevTo } },
      }),
      this.prisma.uSER.count({
        where: { role: 'STUDENT', created_at: { gte: prevFrom, lt: prevTo } },
      }),
      this.prisma.classroom.count({
        where: { created_at: { gte: prevFrom, lt: prevTo } },
      }),
      this.prisma.transaction.aggregate({
        _sum: { amount: true },
        where: { status: 'SUCCESS', created_at: { gte: prevFrom, lt: prevTo } },
      }),
      this.prisma.transaction.count({
        where: { created_at: { gte: prevFrom, lt: prevTo } },
      }),
    ]);

    const totalRevenue = Number(revenueAgg._sum.amount ?? 0);
    const prevRevenue = Number(prevRevenueAgg._sum.amount ?? 0);

    return {
      totalUsers,
      totalTeachers,
      totalStudents,
      totalClassrooms,
      totalRevenue,
      totalTransactions: txCount,
      usersGrowth: this.growth(totalUsers, prevUsers),
      teachersGrowth: this.growth(totalTeachers, prevTeachers),
      studentsGrowth: this.growth(totalStudents, prevStudents),
      classroomsGrowth: this.growth(totalClassrooms, prevClassrooms),
      revenueGrowth: this.growth(totalRevenue, prevRevenue),
      transactionsGrowth: this.growth(txCount, prevTxCount),
    };
  }

  async getUserGrowth(filters: AdminDateFilters) {
    const { from, to } = this.resolveRange(filters);

    const users = await this.prisma.uSER.findMany({
      where: {
        created_at: {
          gte: from,
          lt: to,
        },
      },
      select: {
        created_at: true,
      },
    });

    const byDay = new Map<string, number>();

    for (const u of users) {
      if (!u.created_at) continue;
      const key = u.created_at.toISOString().slice(0, 10);
      byDay.set(key, (byDay.get(key) ?? 0) + 1);
    }

    return Array.from(byDay.entries())
      .sort(([a], [b]) => (a < b ? -1 : 1))
      .map(([date, value]) => ({ date, value }));
  }

  async getUserRoles(_: AdminDateFilters) {
    const grouped = await this.prisma.uSER.groupBy({
      by: ['role'],
      _count: { _all: true },
    });

    return grouped.map((g) => ({
      role: g.role ?? 'UNKNOWN',
      value: g._count._all,
    }));
  }

  async getUserMonthly(filters: AdminDateFilters) {
    const { from, to } = this.resolveRange(filters);

    const users = await this.prisma.uSER.findMany({
      where: {
        created_at: {
          gte: from,
          lt: to,
        },
      },
      select: {
        created_at: true,
      },
    });

    const byMonth = new Map<string, number>();

    for (const u of users) {
      if (!u.created_at) continue;
      const d = u.created_at;
      const key = `${d.getUTCMonth() + 1}/${d.getUTCFullYear()}`;
      byMonth.set(key, (byMonth.get(key) ?? 0) + 1);
    }

    return Array.from(byMonth.entries())
      .sort(([a], [b]) => {
        const [ma, ya] = a.split('/').map(Number);
        const [mb, yb] = b.split('/').map(Number);
        if (ya === yb) return ma - mb;
        return ya - yb;
      })
      .map(([month, value]) => ({ month, value }));
  }

  async getClassrooms(filters: AdminDateFilters) {
    const { from, to } = this.resolveRange(filters);

    const classrooms = await this.prisma.classroom.findMany({
      where: {
        created_at: {
          gte: from,
          lt: to,
        },
        is_deleted: false,
      },
      select: {
        class_id: true,
        class_name: true,
        created_at: true,
      },
    });

    const byMonth = new Map<string, number>();

    for (const c of classrooms) {
      if (!c.created_at) continue;
      const d = c.created_at;
      const key = `${d.getUTCMonth() + 1}/${d.getUTCFullYear()}`;
      byMonth.set(key, (byMonth.get(key) ?? 0) + 1);
    }

    const monthly = Array.from(byMonth.entries())
      .sort(([a], [b]) => {
        const [ma, ya] = a.split('/').map(Number);
        const [mb, yb] = b.split('/').map(Number);
        if (ya === yb) return ma - mb;
        return ya - yb;
      })
      .map(([month, value]) => ({ month, value }));

    const audit = await this.prisma.audit_log.findMany({
      where: {
        table_name: 'classroom',
      },
      select: {
        record_id: true,
      },
    });

    const scores = new Map<number, number>();
    for (const row of audit) {
      if (row.record_id == null) continue;
      scores.set(row.record_id, (scores.get(row.record_id) ?? 0) + 1);
    }

    const withScore = classrooms.map((c) => ({
      id: c.class_id,
      name: c.class_name,
      score: scores.get(c.class_id) ?? 0,
    }));

    const topActive = withScore
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)
      .map((c) => ({ name: c.name, score: c.score }));

    return {
      monthly,
      topActive,
    };
  }

  async getAiUsage(filters: AdminDateFilters) {
    const { from, to } = this.resolveRange(filters);

    const rows = await this.prisma.ai_audit_log.groupBy({
      by: ['feature'],
      _count: { _all: true },
      where: {
        created_at: {
          gte: from,
          lt: to,
        },
      },
    });

    const mapping: Record<string, string> = {
      AI_LESSON_GENERATION: 'lesson',
      AI_QUIZ_GENERATION: 'quiz',
      AI_EXAM_MATRIX_GENERATION: 'exam',
    };

    return rows.map((r) => ({
      feature: mapping[r.feature ?? ''] ?? 'lesson',
      value: r._count._all,
    }));
  }

  async getRevenue(filters: AdminDateFilters) {
    const { from, to } = this.resolveRange(filters);

    const tx = await this.prisma.transaction.findMany({
      where: {
        status: 'SUCCESS',
        created_at: {
          gte: from,
          lt: to,
        },
      },
      select: {
        amount: true,
        created_at: true,
      },
    });

    const byDay = new Map<string, number>();

    for (const t of tx) {
      if (!t.created_at || !t.amount) continue;
      const key = t.created_at.toISOString().slice(0, 10);
      byDay.set(key, (byDay.get(key) ?? 0) + Number(t.amount));
    }

    return Array.from(byDay.entries())
      .sort(([a], [b]) => (a < b ? -1 : 1))
      .map(([date, value]) => ({ date, value }));
  }

  async getTransactions(filters: AdminDateFilters) {
    const { from, to } = this.resolveRange(filters);

    const tx = await this.prisma.transaction.findMany({
      where: {
        created_at: {
          gte: from,
          lt: to,
        },
      },
      include: {
        USER: true,
      },
      orderBy: {
        created_at: 'desc',
      },
      take: 20,
    });

    const byMonth = new Map<string, number>();
    const byStatus = new Map<string, number>();

    for (const t of tx) {
      if (t.created_at) {
        const d = t.created_at;
        const key = `${d.getUTCMonth() + 1}/${d.getUTCFullYear()}`;
        byMonth.set(key, (byMonth.get(key) ?? 0) + 1);
      }

      const status = t.status ?? 'PENDING';
      byStatus.set(status, (byStatus.get(status) ?? 0) + 1);
    }

    const monthly = Array.from(byMonth.entries())
      .sort(([a], [b]) => {
        const [ma, ya] = a.split('/').map(Number);
        const [mb, yb] = b.split('/').map(Number);
        if (ya === yb) return ma - mb;
        return ya - yb;
      })
      .map(([month, value]) => ({ month, value }));

    const statusBreakdown = Array.from(byStatus.entries()).map(
      ([status, value]) => ({
        status,
        value,
      }),
    );

    const recent = tx.map((t) => {
      const userName = t.USER?.user_name ?? 'Unknown user';
      const initials = userName
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase();

      return {
        id: t.transaction_id,
        userName,
        userInitials: initials || '?',
        email: t.USER?.email ?? '',
        planName: t.transaction_type ?? 'Unknown',
        amount: Number(t.amount ?? 0),
        status: t.status ?? 'PENDING',
        createdAt: t.created_at?.toISOString() ?? new Date().toISOString(),
      };
    });

    return {
      monthly,
      statusBreakdown,
      recent,
    };
  }
}
