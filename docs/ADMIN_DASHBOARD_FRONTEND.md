# Admin Dashboard - Frontend Implementation Guide

## 📱 Cách Gọi API từ Frontend

### 1. **Base Setup**

```typescript
// services/admin-dashboard.service.ts

import axios, { AxiosInstance } from 'axios';

class AdminDashboardService {
  private api: AxiosInstance;

  constructor(token: string) {
    this.api = axios.create({
      baseURL: '/api/admin/dashboard',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  // Comprehensive Dashboard
  async getComprehensiveDashboard() {
    return this.api.get('/comprehensive');
  }

  // Statistics
  async getStatistics() {
    return this.api.get('/statistics');
  }

  async getUserMetrics() {
    return this.api.get('/user-metrics');
  }

  async getTransactionMetrics() {
    return this.api.get('/transaction-metrics');
  }

  // Daily Analytics
  async getDailyRevenue(days = 30) {
    return this.api.get('/daily-revenue', { params: { days } });
  }

  async getHourlyRevenue(date?: string) {
    return this.api.get('/hourly-revenue', { params: { date } });
  }

  // Comparisons
  async compareTwoDays(date1: string, date2: string) {
    return this.api.get('/compare-days', { params: { date1, date2 } });
  }

  async compareTwoMonths(month1: string, month2: string) {
    return this.api.get('/compare-months', { params: { month1, month2 } });
  }

  // Year over Year
  async getYearOverYearAnalysis() {
    return this.api.get('/year-over-year');
  }

  // Top Products
  async getTopProducts(limit = 10) {
    return this.api.get('/top-products', { params: { limit } });
  }

  // Trending
  async getTrendingMetrics(
    metric: 'revenue' | 'users' | 'transactions' = 'revenue',
  ) {
    return this.api.get('/trending-metrics', { params: { metric } });
  }

  // Date Range
  async analyzeDateRange(startDate: string, endDate: string) {
    return this.api.get('/date-range-analytics', {
      params: { startDate, endDate },
    });
  }

  // Others
  async getMonthlyRevenue(months = 12) {
    return this.api.get('/monthly-revenue', { params: { months } });
  }

  async getRecentTransactions(limit = 10) {
    return this.api.get('/recent-transactions', { params: { limit } });
  }

  async getRecentUsers(limit = 10) {
    return this.api.get('/recent-users', { params: { limit } });
  }
}

export default AdminDashboardService;
```

---

## 🎨 React Component Examples

### 1. **Dashboard Overview**

```typescript
// components/Dashboard/Overview.tsx

import React, { useEffect, useState } from 'react';
import AdminDashboardService from '../../services/admin-dashboard.service';

interface OverviewData {
  totalUsers: number;
  totalRevenue: number;
  totalTransactions: number;
  completedTransactions: number;
  totalClassrooms: number;
  activeSubscriptions: number;
}

const Overview: React.FC<{ token: string }> = ({ token }) => {
  const [data, setData] = useState<OverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const service = new AdminDashboardService(token);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await service.getStatistics();
        setData(response.data);
      } catch (error) {
        console.error('Failed to load overview:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="bg-blue-500 text-white p-6 rounded-lg">
        <h3 className="text-lg font-semibold">Tổng User</h3>
        <p className="text-3xl font-bold">{data?.totalUsers.toLocaleString()}</p>
      </div>
      <div className="bg-green-500 text-white p-6 rounded-lg">
        <h3 className="text-lg font-semibold">Tổng Doanh Thu</h3>
        <p className="text-3xl font-bold">
          {(data?.totalRevenue || 0).toLocaleString()} đ
        </p>
      </div>
      <div className="bg-purple-500 text-white p-6 rounded-lg">
        <h3 className="text-lg font-semibold">Giao Dịch</h3>
        <p className="text-3xl font-bold">
          {data?.completedTransactions}/{data?.totalTransactions}
        </p>
      </div>
    </div>
  );
};

export default Overview;
```

---

### 2. **Daily Comparison Chart**

```typescript
// components/Dashboard/DailyComparison.tsx

import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import AdminDashboardService from '../../services/admin-dashboard.service';

interface ComparisonData {
  date1: string;
  revenue1: number;
  transactions1: number;
  date2: string;
  revenue2: number;
  transactions2: number;
  revenueChangePercent: number;
  transactionChangePercent: number;
}

const DailyComparison: React.FC<{ token: string }> = ({ token }) => {
  const [data, setData] = useState<ComparisonData | null>(null);
  const [loading, setLoading] = useState(true);
  const service = new AdminDashboardService(token);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await service.compareTwoDays(
          // Yesterday vs Today
          new Date(Date.now() - 86400000).toISOString().split('T')[0],
          new Date().toISOString().split('T')[0]
        );
        setData(response.data);
      } catch (error) {
        console.error('Failed to load comparison:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) return <div>Loading...</div>;
  if (!data) return <div>No data</div>;

  const chartData = [
    {
      name: 'Doanh Thu',
      [data.date1]: data.revenue1,
      [data.date2]: data.revenue2,
    },
  ];

  return (
    <div className="bg-white p-6 rounded-lg">
      <h2 className="text-xl font-bold mb-4">So Sánh Doanh Thu Hôm Nay</h2>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey={data.date1} fill="#8884d8" />
          <Bar dataKey={data.date2} fill="#82ca9d" />
        </BarChart>
      </ResponsiveContainer>
      <div className="mt-4 text-center">
        <p className="text-lg">
          Doanh thu tăng{' '}
          <span className={data.revenueChangePercent > 0 ? 'text-green-600 font-bold' : 'text-red-600 font-bold'}>
            {data.revenueChangePercent > 0 ? '+' : ''}
            {data.revenueChangePercent.toFixed(1)}%
          </span>
        </p>
      </div>
    </div>
  );
};

export default DailyComparison;
```

---

### 3. **Hourly Revenue Chart**

```typescript
// components/Dashboard/HourlyRevenue.tsx

import React, { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import AdminDashboardService from '../../services/admin-dashboard.service';

interface HourlyData {
  hour: number;
  revenue: number;
  transactionCount: number;
  averageTransactionValue: number;
}

const HourlyRevenue: React.FC<{ token: string }> = ({ token }) => {
  const [data, setData] = useState<HourlyData[]>([]);
  const [loading, setLoading] = useState(true);
  const service = new AdminDashboardService(token);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await service.getHourlyRevenue();
        setData(response.data);
      } catch (error) {
        console.error('Failed to load hourly data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <div className="bg-white p-6 rounded-lg">
      <h2 className="text-xl font-bold mb-4">Doanh Thu Theo Giờ</h2>
      <ResponsiveContainer width="100%" height={400}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="hour"
            tickFormatter={(hour) => `${hour}:00`}
          />
          <YAxis />
          <Tooltip
            formatter={(value) => value.toLocaleString()}
            labelFormatter={(label) => `${label}:00`}
          />
          <Legend />
          <Line type="monotone" dataKey="revenue" stroke="#8884d8" name="Doanh Thu" />
          <Line type="monotone" dataKey="transactionCount" stroke="#82ca9d" name="Giao Dịch" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default HourlyRevenue;
```

---

### 4. **Top Products Pie Chart**

```typescript
// components/Dashboard/TopProducts.tsx

import React, { useEffect, useState } from 'react';
import { PieChart, Pie, Cell, Legend, Tooltip, ResponsiveContainer } from 'recharts';
import AdminDashboardService from '../../services/admin-dashboard.service';

interface ProductData {
  sub_code: string;
  sub_name: string;
  soldCount: number;
  totalRevenue: number;
  avgRevenue: number;
  percentage: number;
}

const TopProducts: React.FC<{ token: string }> = ({ token }) => {
  const [data, setData] = useState<ProductData[]>([]);
  const [loading, setLoading] = useState(true);
  const service = new AdminDashboardService(token);

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await service.getTopProducts(5);
        setData(response.data);
      } catch (error) {
        console.error('Failed to load top products:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <div className="bg-white p-6 rounded-lg">
      <h2 className="text-xl font-bold mb-4">Top 5 Gói Subscription</h2>
      <ResponsiveContainer width="100%" height={400}>
        <PieChart>
          <Pie
            data={data}
            dataKey="percentage"
            nameKey="sub_name"
            cx="50%"
            cy="50%"
            label
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip formatter={(value) => `${value.toFixed(1)}%`} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
      <div className="mt-4">
        {data.map((product) => (
          <div key={product.sub_code} className="flex justify-between py-2 border-b">
            <span className="font-semibold">{product.sub_name}</span>
            <span className="text-gray-600">{product.percentage.toFixed(1)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TopProducts;
```

---

### 5. **Monthly Trend Chart**

```typescript
// components/Dashboard/MonthlyTrend.tsx

import React, { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import AdminDashboardService from '../../services/admin-dashboard.service';

interface MonthlyData {
  month: string;
  revenue: number;
  transactionCount: number;
}

const MonthlyTrend: React.FC<{ token: string }> = ({ token }) => {
  const [data, setData] = useState<MonthlyData[]>([]);
  const [loading, setLoading] = useState(true);
  const service = new AdminDashboardService(token);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await service.getMonthlyRevenue(12);
        setData(response.data);
      } catch (error) {
        console.error('Failed to load monthly data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <div className="bg-white p-6 rounded-lg">
      <h2 className="text-xl font-bold mb-4">Doanh Thu 12 Tháng</h2>
      <ResponsiveContainer width="100%" height={400}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="month" />
          <YAxis />
          <Tooltip formatter={(value) => value.toLocaleString()} />
          <Legend />
          <Line type="monotone" dataKey="revenue" stroke="#8884d8" name="Doanh Thu" />
          <Line type="monotone" dataKey="transactionCount" stroke="#82ca9d" name="Số Giao Dịch" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default MonthlyTrend;
```

---

### 6. **User Metrics Card**

```typescript
// components/Dashboard/UserMetrics.tsx

import React, { useEffect, useState } from 'react';
import AdminDashboardService from '../../services/admin-dashboard.service';

interface UserMetricsData {
  totalUsers: number;
  newUsersToday: number;
  newUsersThisWeek: number;
  newUsersThisMonth: number;
  activeUsersToday: number;
  conversionRate: number;
  retentionRate: number;
}

const UserMetrics: React.FC<{ token: string }> = ({ token }) => {
  const [data, setData] = useState<UserMetricsData | null>(null);
  const [loading, setLoading] = useState(true);
  const service = new AdminDashboardService(token);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await service.getUserMetrics();
        setData(response.data);
      } catch (error) {
        console.error('Failed to load user metrics:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <div className="bg-white p-6 rounded-lg">
      <h2 className="text-xl font-bold mb-6">Metrics Người Dùng</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-blue-50 p-4 rounded-lg">
          <p className="text-gray-600 text-sm">Tổng User</p>
          <p className="text-2xl font-bold">{data?.totalUsers.toLocaleString()}</p>
        </div>
        <div className="bg-green-50 p-4 rounded-lg">
          <p className="text-gray-600 text-sm">User Mới Hôm Nay</p>
          <p className="text-2xl font-bold">{data?.newUsersToday}</p>
        </div>
        <div className="bg-yellow-50 p-4 rounded-lg">
          <p className="text-gray-600 text-sm">User Mới Tuần Này</p>
          <p className="text-2xl font-bold">{data?.newUsersThisWeek}</p>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg">
          <p className="text-gray-600 text-sm">User Hoạt Động Hôm Nay</p>
          <p className="text-2xl font-bold">{data?.activeUsersToday}</p>
        </div>
        <div className="bg-red-50 p-4 rounded-lg">
          <p className="text-gray-600 text-sm">Tỉ Lệ Chuyên Đổi</p>
          <p className="text-2xl font-bold">{data?.conversionRate.toFixed(1)}%</p>
        </div>
        <div className="bg-indigo-50 p-4 rounded-lg">
          <p className="text-gray-600 text-sm">Tỉ Lệ Giữ Chân</p>
          <p className="text-2xl font-bold">{data?.retentionRate.toFixed(1)}%</p>
        </div>
      </div>
    </div>
  );
};

export default UserMetrics;
```

---

## 🔄 Complete Dashboard Layout

```typescript
// pages/AdminDashboard.tsx

import React from 'react';
import Overview from '../components/Dashboard/Overview';
import DailyComparison from '../components/Dashboard/DailyComparison';
import HourlyRevenue from '../components/Dashboard/HourlyRevenue';
import TopProducts from '../components/Dashboard/TopProducts';
import MonthlyTrend from '../components/Dashboard/MonthlyTrend';
import UserMetrics from '../components/Dashboard/UserMetrics';

const AdminDashboard: React.FC<{ token: string }> = ({ token }) => {
  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <h1 className="text-4xl font-bold mb-8 text-gray-800">Admin Dashboard</h1>

      <div className="space-y-6">
        <Overview token={token} />
        <UserMetrics token={token} />
        <DailyComparison token={token} />
        <HourlyRevenue token={token} />
        <TopProducts token={token} />
        <MonthlyTrend token={token} />
      </div>
    </div>
  );
};

export default AdminDashboard;
```

---

## 🚀 Installation & Setup

```bash
# Install required packages
npm install axios recharts

# or with yarn
yarn add axios recharts

# or with pnpm
pnpm add axios recharts
```

---

## 🎯 Best Practices

1. **Use caching**: Implement React Query or SWR for data caching
2. **Error boundaries**: Wrap components in error boundaries
3. **Loading states**: Always show loading indicators
4. **Date formatting**: Use date-fns or dayjs for date handling
5. **Responsive design**: Use Tailwind/Bootstrap for responsive layouts

---

**Last Updated**: March 11, 2026  
**React Version**: 18+  
**TypeScript**: 5.0+
