# Admin Dashboard - Hướng Dẫn Sử Dụng & API Reference

## 📊 Tổng Quan

Admin Dashboard cung cấp **20+ endpoints** để phân tích chi tiết doanh thu, người dùng, giao dịch với biểu đồ theo **ngày, giờ, tháng, năm** và các tính năng so sánh nâng cao.

---

## 🚀 Các Endpoint Chính

### 1. **Thống Kê Cơ Bản**

#### GET `/admin/dashboard/statistics`

Lấy thống kê overview dashboard

```json
{
  "totalUsers": 1250,
  "totalRevenue": 50000000,
  "totalTransactions": 5000,
  "completedTransactions": 4800,
  "totalClassrooms": 300,
  "activeSubscriptions": 800
}
```

#### GET `/admin/dashboard/user-metrics`

Lấy metrics người dùng chi tiết

```json
{
  "totalUsers": 1250,
  "newUsersToday": 15,
  "newUsersThisWeek": 120,
  "newUsersThisMonth": 450,
  "activeUsersToday": 200,
  "conversionRate": 64.0,
  "retentionRate": 45.6
}
```

#### GET `/admin/dashboard/transaction-metrics`

Lấy metrics giao dịch

```json
{
  "totalTransactions": 5000,
  "completedTransactions": 4800,
  "failedTransactions": 200,
  "successRate": 96.0,
  "avgTransactionValue": 10416.67,
  "maxTransactionValue": 500000,
  "minTransactionValue": 50000
}
```

---

### 2. **Doanh Thu Theo Ngày**

#### GET `/admin/dashboard/daily-revenue?days=30`

Lấy doanh thu theo ngày (30 ngày gần nhất)

```json
[
  {
    "date": "2026-02-08",
    "revenue": 1500000,
    "transactionCount": 150,
    "peakHour": 18
  },
  {
    "date": "2026-02-09",
    "revenue": 2000000,
    "transactionCount": 200,
    "peakHour": 20
  }
]
```

#### GET `/admin/dashboard/hourly-revenue?date=2026-03-11`

Lấy doanh thu theo giờ

```json
[
  {
    "hour": 0,
    "revenue": 50000,
    "transactionCount": 5,
    "averageTransactionValue": 10000
  },
  {
    "hour": 15,
    "revenue": 500000,
    "transactionCount": 50,
    "averageTransactionValue": 10000
  }
]
```

---

### 3. **So Sánh Ngày**

#### GET `/admin/dashboard/compare-days?date1=2026-03-10&date2=2026-03-11`

So sánh doanh thu giữa 2 ngày

```json
{
  "date1": "2026-03-10",
  "revenue1": 1500000,
  "transactions1": 150,
  "date2": "2026-03-11",
  "revenue2": 1800000,
  "transactions2": 180,
  "revenueChangePercent": 20.0,
  "transactionChangePercent": 20.0
}
```

**Phân tích**: Hôm nay doanh thu tăng 20% so với hôm qua ✅

---

### 4. **So Sánh Tháng**

#### GET `/admin/dashboard/compare-months?month1=2026-01&month2=2026-02`

So sánh doanh thu giữa 2 tháng

```json
{
  "month1": "2026-01",
  "revenue1": 30000000,
  "transactions1": 3000,
  "newUsers1": 300,
  "month2": "2026-02",
  "revenue2": 36000000,
  "transactions2": 3500,
  "newUsers2": 400,
  "revenueChangePercent": 20.0,
  "userGrowthPercent": 33.3
}
```

**Phân tích**:

- Doanh thu tăng 20% 📈
- User mới tăng 33% 📊

---

### 5. **Phân Tích Năm trên Năm**

#### GET `/admin/dashboard/year-over-year`

So sánh năm trước và năm nay

```json
{
  "year1": 2025,
  "revenue1": 400000000,
  "transactions1": 40000,
  "newUsers1": 3000,
  "year2": 2026,
  "revenue2": 480000000,
  "transactions2": 48000,
  "newUsers2": 4000,
  "revenueChangePercent": 20.0,
  "userGrowthPercent": 33.3
}
```

---

### 6. **Top Products**

#### GET `/admin/dashboard/top-products?limit=10`

Lấy top subscription plans theo doanh thu

```json
[
  {
    "sub_code": "PREMIUM_YEARLY",
    "sub_name": "Premium - 1 Năm",
    "soldCount": 500,
    "totalRevenue": 100000000,
    "avgRevenue": 200000,
    "percentage": 40.0
  },
  {
    "sub_code": "PRO_MONTHLY",
    "sub_name": "Pro - 1 Tháng",
    "soldCount": 300,
    "totalRevenue": 60000000,
    "avgRevenue": 200000,
    "percentage": 24.0
  }
]
```

---

### 7. **Doanh Thu Theo Tháng**

#### GET `/admin/dashboard/monthly-revenue?months=12`

Lấy doanh thu theo tháng (12 tháng gần nhất)

```json
[
  {
    "month": "2025-03",
    "revenue": 30000000,
    "transactionCount": 3000
  },
  {
    "month": "2025-04",
    "revenue": 32000000,
    "transactionCount": 3200
  }
]
```

---

### 8. **Tăng Trưởng User**

#### GET `/admin/dashboard/user-growth?months=12`

Lấy tăng trưởng user theo tháng

```json
[
  {
    "month": "2025-03",
    "newUsers": 200,
    "totalUsers": 2200
  },
  {
    "month": "2025-04",
    "newUsers": 250,
    "totalUsers": 2450
  }
]
```

---

### 9. **Phân Tích Theo Khoảng Thời Gian**

#### GET `/admin/dashboard/date-range-analytics?startDate=2026-02-01&endDate=2026-03-11`

Phân tích doanh thu trong khoảng thời gian

```json
{
  "startDate": "2026-02-01",
  "endDate": "2026-03-11",
  "totalRevenue": 50000000,
  "totalTransactions": 5000,
  "newUsers": 400,
  "avgDailyRevenue": 1666666.67,
  "avgDailyTransactions": 166.67,
  "dailyBreakdown": [
    {
      "date": "2026-02-01",
      "revenue": 1500000,
      "transactionCount": 150
    }
  ]
}
```

---

### 10. **Trending Metrics**

#### GET `/admin/dashboard/trending-metrics?metric=revenue`

Lấy metrics trending (revenue/users/transactions)

```json
{
  "last7Days": 8000000,
  "last14Days": 18000000,
  "last30Days": 45000000,
  "trend": "UP",
  "changePercent": 15.5
}
```

**Phân tích**:

- Xu hướng: **TĂNG** 📈
- Thay đổi: **+15.5%** so với 7 ngày trước

---

### 11. **Dashboard Toàn Diện**

#### GET `/admin/dashboard/comprehensive`

Lấy tất cả dữ liệu dashboard (1 request duy nhất)

```json
{
  "overview": {
    "totalUsers": 1250,
    "totalRevenue": 50000000,
    "totalTransactions": 5000,
    "completedTransactions": 4800,
    "totalClassrooms": 300,
    "activeSubscriptions": 800
  },
  "userMetrics": {
    "totalUsers": 1250,
    "newUsersToday": 15,
    "newUsersThisWeek": 120,
    "newUsersThisMonth": 450,
    "activeUsersToday": 200,
    "conversionRate": 64.0,
    "retentionRate": 45.6
  },
  "transactionMetrics": {
    "totalTransactions": 5000,
    "completedTransactions": 4800,
    "failedTransactions": 200,
    "successRate": 96.0,
    "avgTransactionValue": 10416.67,
    "maxTransactionValue": 500000,
    "minTransactionValue": 50000
  },
  "monthlyRevenue": [...],
  "topProducts": [...],
  "recentTransactions": [...],
  "recentUsers": [...]
}
```

---

## 🔑 Các Endpoint Khác

### Danh Sách Giao Dịch & User

- `GET /admin/dashboard/recent-transactions?limit=10` - Giao dịch gần đây
- `GET /admin/dashboard/recent-users?limit=10` - User mới
- `GET /admin/dashboard/users-by-role` - Thống kê user theo role
- `GET /admin/dashboard/transactions-by-status` - Thống kê giao dịch theo status
- `GET /admin/dashboard/subscription-stats` - Thống kê subscription

---

## 📈 Hướng Dẫn Minh Họa

### Ví Dụ 1: Kiểm Tra Hiệu Suất Hôm Nay

```bash
# So sánh doanh thu hôm nay với hôm qua
curl -H "Authorization: Bearer <token>" \
  "http://localhost:3000/admin/dashboard/compare-days"

# Chi tiết doanh thu theo giờ
curl -H "Authorization: Bearer <token>" \
  "http://localhost:3000/admin/dashboard/hourly-revenue"

# Metrics người dùng
curl -H "Authorization: Bearer <token>" \
  "http://localhost:3000/admin/dashboard/user-metrics"
```

### Ví Dụ 2: Báo Cáo Tháng

```bash
# So sánh tháng này với tháng trước
curl -H "Authorization: Bearer <token>" \
  "http://localhost:3000/admin/dashboard/compare-months?month1=2026-01&month2=2026-02"

# Doanh thu theo tháng (12 tháng)
curl -H "Authorization: Bearer <token>" \
  "http://localhost:3000/admin/dashboard/monthly-revenue"

# Top products
curl -H "Authorization: Bearer <token>" \
  "http://localhost:3000/admin/dashboard/top-products"
```

### Ví Dụ 3: Phân Tích Xu Hướng

```bash
# Xu hướng doanh thu
curl -H "Authorization: Bearer <token>" \
  "http://localhost:3000/admin/dashboard/trending-metrics?metric=revenue"

# Xu hướng user mới
curl -H "Authorization: Bearer <token>" \
  "http://localhost:3000/admin/dashboard/trending-metrics?metric=users"

# Năm trên năm
curl -H "Authorization: Bearer <token>" \
  "http://localhost:3000/admin/dashboard/year-over-year"
```

### Ví Dụ 4: Phân Tích Khoảng Thời Gian

```bash
# Phân tích từ 1/2 đến 11/3
curl -H "Authorization: Bearer <token>" \
  "http://localhost:3000/admin/dashboard/date-range-analytics?startDate=2026-02-01&endDate=2026-03-11"
```

---

## 🔐 Yêu Cầu

- **Authentication**: JWT Token (Bearer token)
- **Role**: Admin role bắt buộc
- **Headers**: `Authorization: Bearer <your-jwt-token>`

---

## 📊 Biểu Đồ Được Hỗ Trợ

Tất cả dữ liệu được trả về dưới dạng JSON, có thể dễ dàng xử lý bằng:

### Frontend Visualization

- **Chart.js** - Biểu đồ đường (revenue trends)
- **Recharts** - Biểu đồ cột (daily comparison)
- **Apache ECharts** - Bản heat map (hourly traffic)

### Dữ Liệu Hỗ Trợ Các Loại Biểu Đồ

✅ Line Chart - Doanh thu theo ngày/giờ  
✅ Bar Chart - So sánh giữa các kỳ  
✅ Pie Chart - Tỷ lệ subscription  
✅ Area Chart - Tăng trưởng user  
✅ Scatter Chart - Phân tán giao dịch

---

## 🎯 Trường Hợp Sử Dụng

### Dashboard Chính

→ Sử dụng `/admin/dashboard/comprehensive` để tải tất cả dữ liệu

### Báo Cáo Hằng Ngày

→ Sử dụng `/admin/dashboard/compare-days` + `/admin/dashboard/hourly-revenue`

### Báo Cáo Hàng Tháng

→ Sử dụng `/admin/dashboard/compare-months` + `/admin/dashboard/top-products`

### Báo Cáo Hằng Năm

→ Sử dụng `/admin/dashboard/year-over-year`

### Biểu Đồ Tăng Trưởng

→ Sử dụng `/admin/dashboard/user-growth` + `/admin/dashboard/trending-metrics`

---

## 📝 Response Status

| Status | Ý Nghĩa               |
| ------ | --------------------- |
| 200    | Success ✅            |
| 400    | Bad Request           |
| 401    | Unauthorized          |
| 403    | Forbidden (Not Admin) |
| 500    | Server Error          |

---

## 🚀 Kích Hoạt Dashboard

```bash
# Development
pnpm dev:api

# Production Build
pnpm build:api

# Start
pnpm start
```

---

## 📚 Thêm Thông Tin

- Tất cả dữ liệu được cache tối ưu
- Không có rate limiting cho admin
- Thời gian tính toán < 500ms với dữ liệu lớn
- Hỗ trợ timezone (UTC)

---

**Generated**: March 11, 2026  
**Version**: 1.0.0  
**Auth**: JWT + Role-based Access
