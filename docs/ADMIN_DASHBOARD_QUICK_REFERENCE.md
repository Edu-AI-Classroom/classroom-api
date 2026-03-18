# Admin Dashboard - Quick Reference

## 📊 Tất Cả Endpoints

| #   | Endpoint                                  | Method | Mô Tả                      | Query Parameters                      |
| --- | ----------------------------------------- | ------ | -------------------------- | ------------------------------------- |
| 1   | `/admin/dashboard/statistics`             | GET    | Thống kê overview          | -                                     |
| 2   | `/admin/dashboard/user-metrics`           | GET    | Metrics người dùng         | -                                     |
| 3   | `/admin/dashboard/transaction-metrics`    | GET    | Metrics giao dịch          | -                                     |
| 4   | `/admin/dashboard/daily-revenue`          | GET    | Doanh thu hàng ngày        | `days=30`                             |
| 5   | `/admin/dashboard/hourly-revenue`         | GET    | Doanh thu hàng giờ         | `date=2026-03-11`                     |
| 6   | `/admin/dashboard/compare-days`           | GET    | So sánh 2 ngày             | `date1`, `date2`                      |
| 7   | `/admin/dashboard/compare-months`         | GET    | So sánh 2 tháng            | `month1`, `month2`                    |
| 8   | `/admin/dashboard/year-over-year`         | GET    | Năm trên năm               | -                                     |
| 9   | `/admin/dashboard/top-products`           | GET    | Top products               | `limit=10`                            |
| 10  | `/admin/dashboard/monthly-revenue`        | GET    | Doanh thu/tháng            | `months=12`                           |
| 11  | `/admin/dashboard/user-growth`            | GET    | Tăng trưởng user           | `months=12`                           |
| 12  | `/admin/dashboard/trending-metrics`       | GET    | Trending metrics           | `metric=revenue\|users\|transactions` |
| 13  | `/admin/dashboard/date-range-analytics`   | GET    | Phân tích khoảng thời gian | `startDate`, `endDate`                |
| 14  | `/admin/dashboard/recent-transactions`    | GET    | Giao dịch gần đây          | `limit=10`                            |
| 15  | `/admin/dashboard/recent-users`           | GET    | User mới                   | `limit=10`                            |
| 16  | `/admin/dashboard/users-by-role`          | GET    | User theo role             | -                                     |
| 17  | `/admin/dashboard/transactions-by-status` | GET    | Giao dịch theo status      | -                                     |
| 18  | `/admin/dashboard/subscription-stats`     | GET    | Thống kê subscription      | -                                     |
| 19  | `/admin/dashboard/comprehensive`          | GET    | Dashboard toàn diện        | -                                     |

---

## 📈 Biểu Đồ Phù Hợp Cho Mỗi Endpoint

```
Endpoint                          │ Loại Biểu Đồ
─────────────────────────────────┼──────────────────────────
statistics                        │ KPI Cards
user-metrics                      │ Cards / Metrics
transaction-metrics               │ Cards / Gauge
daily-revenue                     │ Line Chart / Area Chart
hourly-revenue                    │ Bar Chart / Line Chart
compare-days                      │ Bar Chart / Column Chart
compare-months                    │ Bar Chart / Line Chart
year-over-year                    │ Bar Chart / Column Chart
top-products                      │ Pie Chart / Donut Chart
monthly-revenue                   │ Line Chart / Area Chart
user-growth                       │ Area Chart / Stacked Chart
trending-metrics                  │ Line Chart / Sparkline
date-range-analytics              │ Line Chart + Table
recent-transactions               │ Table
recent-users                      │ Table
users-by-role                     │ Pie Chart / Bar Chart
transactions-by-status            │ Pie Chart / Bar Chart
subscription-stats                │ Bar Chart / Table
comprehensive                     │ All Charts Combined
```

---

## 🎨 Màu Sắc Đề Xuất

```css
/* Primary Colors */
--revenue: #4f46e5; /* Indigo */
--users: #10b981; /* Green */
--transactions: #f59e0b; /* Amber */
--growth: #ec4899; /* Pink */
--alert: #ef4444; /* Red */

/* Chart Colors */
--chart-blue: #3b82f6;
--chart-green: #10b981;
--chart-purple: #8b5cf6;
--chart-yellow: #f59e0b;
--chart-red: #ef4444;
--chart-pink: #ec4899;
--chart-cyan: #06b6d4;
--chart-orange: #f97316;
```

---

## 🔄 Dữ Liệu Thay Đổi

### Tần Suất Cập Nhật Đề Xuất

| Data Type  | Frequency       | Use Case         |
| ---------- | --------------- | ---------------- |
| Statistics | Real-time / 30s | Overview cards   |
| Daily      | Hourly          | Daily charts     |
| Hourly     | Every 15 min    | Hour-by-hour     |
| Monthly    | Daily           | Month comparison |
| YoY        | Weekly          | Annual reports   |
| Trending   | Real-time       | Live indicators  |

---

## 💾 Response Format Tiêu Chuẩn

```typescript
// Success Response
{
  "statusCode": 200,
  "message": "Success",
  "data": {
    // actual data
  }
}

// Error Response
{
  "statusCode": 400,
  "message": "Invalid parameters",
  "error": "Bad Request"
}
```

---

## 🔐 Security Headers

```bash
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     -H "Content-Type: application/json" \
     "http://localhost:3000/api/admin/dashboard/statistics"
```

---

## ⚡ Performance Tips

1. **Caching**
   - Cache data 5-15 mins for non-real-time data
   - Real-time updates for trending metrics
   - Use Redis for backend caching

2. **API Optimization**
   - Use `/comprehensive` for full dashboard
   - Paginate large result sets
   - Filter dates server-side

3. **Frontend Optimization**
   - Lazy load chart components
   - Use data virtualization for long lists
   - Debounce real-time updates

---

## 📱 Responsive Breakpoints

```css
/* Mobile: 320px - 640px */
/* Tablet: 641px - 1024px */
/* Desktop: 1025px+ */

/* Grid Layout */
Mobile:   1 column
Tablet:   2 columns
Desktop:  3 columns
```

---

## 🎯 Common Use Cases

### 📋 Daily Report

```bash
GET /admin/dashboard/statistics
GET /admin/dashboard/compare-days?date1=YYYY-MM-DD&date2=YYYY-MM-DD
GET /admin/dashboard/hourly-revenue
GET /admin/dashboard/user-metrics
```

### 📊 Weekly Report

```bash
GET /admin/dashboard/daily-revenue?days=7
GET /admin/dashboard/trending-metrics?metric=revenue
GET /admin/dashboard/top-products
```

### 📈 Monthly Report

```bash
GET /admin/dashboard/compare-months?month1=YYYY-MM&month2=YYYY-MM
GET /admin/dashboard/monthly-revenue?months=12
GET /admin/dashboard/user-growth?months=12
```

### 📉 Annual Report

```bash
GET /admin/dashboard/year-over-year
GET /admin/dashboard/monthly-revenue?months=24
```

---

## 🛠️ Troubleshooting

| Issue            | Solution                              |
| ---------------- | ------------------------------------- |
| 401 Unauthorized | Check JWT token validity              |
| 403 Forbidden    | Verify user has ADMIN role            |
| Empty data       | Check date ranges are valid           |
| Slow response    | Use date range filter, increase cache |
| CORS errors      | Verify API CORS configuration         |

---

## 📚 Integration Examples

### Vue.js

```javascript
// Use with Axios
async function fetchDashboardData() {
  const response = await axios.get('/api/admin/dashboard/statistics', {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
}
```

### Angular

```typescript
// Use with HttpClient
this.http.get('/api/admin/dashboard/statistics').subscribe((data) => {
  this.dashboardData = data;
});
```

### Node.js Backend

```javascript
// Use with node-fetch
const response = await fetch('/api/admin/dashboard/statistics', {
  headers: { Authorization: `Bearer ${token}` },
});
const data = await response.json();
```

---

## 📞 Support

- **Documentation**: See `ADMIN_DASHBOARD_GUIDE.md`
- **Frontend Examples**: See `ADMIN_DASHBOARD_FRONTEND.md`
- **Service Location**: `src/modules/admin/admin.service.ts`
- **Controller Location**: `src/modules/admin/admin.controller.ts`
- **DTOs Location**: `src/modules/admin/dtos/dashboard.dto.ts`

---

## ✅ Checklist for Dashboard Deployment

- [ ] All endpoints tested locally
- [ ] JWT authentication verified
- [ ] Admin role authorization working
- [ ] CORS configured correctly
- [ ] Frontend components loaded successfully
- [ ] Charts displaying data correctly
- [ ] Real-time updates working
- [ ] Cache strategy implemented
- [ ] Error handling in place
- [ ] Documentation reviewed
- [ ] Performance optimized
- [ ] Security headers added

---

**Last Update**: March 11, 2026  
**Version**: 1.0.0  
**Status**: Production Ready ✅
