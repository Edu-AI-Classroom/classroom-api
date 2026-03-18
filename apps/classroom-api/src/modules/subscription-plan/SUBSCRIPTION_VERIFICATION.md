# Subscription Verification

Hệ thống kiểm tra subscription cho người dùng.

## Tính năng

### 1. `SubscriptionGuard`

Guard kiểm tra xem user đã đăng ký gói subscription còn hạn hay chưa.

**Cách sử dụng:**

```typescript
import { SubscriptionGuard } from '../../common/guards/subscription.guard';
import { UseGuards } from '@nestjs/common';

@Controller('some-feature')
export class SomeFeatureController {
  @Get()
  @UseGuards(JwtAuthGuard, SubscriptionGuard)
  someEndpoint() {
    // Chỉ user có subscription còn hạn mới có thể gọi endpoint này
  }
}
```

**Hành vi:**

- Nếu user chưa đăng ký gói: throw `ForbiddenException` với message "Bạn cần đăng ký gói subscription để sử dụng chức năng này"
- Nếu gói đã hết hạn: throw `ForbiddenException` tương tự
- Nếu gói còn hạn: cho phép tiếp tục

### 2. Service Methods

#### `isUserSubscriptionActive(userId: number): Promise<boolean>`

Kiểm tra xem user có subscription còn hạn hay không.

```typescript
const isActive =
  await this.subscriptionPlanService.isUserSubscriptionActive(userId);
// Returns: true nếu còn hạn, false nếu chưa đăng ký hoặc hết hạn
```

#### `getUserSubscription(userId: number)`

Lấy thông tin chi tiết về subscription của user.

```typescript
const subInfo = await this.subscriptionPlanService.getUserSubscription(userId);
// Returns:
// {
//   subId: number,
//   subName: string,
//   status: string,
//   startDate: DateTime,
//   expiredAt: DateTime,
//   isExpired: boolean,
//   daysRemaining: number
// }
```

### 3. API Endpoints

#### `GET /subscription-plans/user/my-subscription`

Lấy thông tin subscription hiện tại của user đang đăng nhập.

**Header:**

```
Authorization: Bearer <JWT_TOKEN>
```

**Response:**

```json
{
  "subId": 1,
  "subName": "Premium Plan",
  "status": "ACTIVE",
  "startDate": "2025-03-19T10:00:00Z",
  "expiredAt": "2025-06-19T10:00:00Z",
  "isExpired": false,
  "daysRemaining": 92
}
```

## Database Schema

```prisma
model personal_info {
  user_id        Int               @id
  sub_id         Int?
  sub_status     String?           @db.VarChar(50)  // ACTIVE, EXPIRED, INACTIVE
  sub_start_date DateTime?         @db.Timestamp(6)
  expired_at     DateTime?         @db.Timestamp(6) // calculated: created_at + duration_days

  subscription_plan subscription_plan? @relation(...)
  USER              USER               @relation(...)
}
```

## Automatic expiration calculation

Khi payment thành công (`transaction.status = 'PAID'`):

```
expired_at = transaction.created_at + subscription_plan.duration_days
```

Ví dụ:

- User thanh toán vào: 2025-03-19
- Gói có duration: 90 ngày
- Tự động set expired_at: 2025-06-18

## Sử dụng trong thực tế

**Ví dụ 1: Bảo vệ AI Quiz feature**

```typescript
@Controller('ai-quiz')
export class AiQuizController {
  @Post('generate')
  @UseGuards(JwtAuthGuard, SubscriptionGuard) // <- Thêm guard này
  async generateQuiz(@Body() dto: GenerateQuizDto) {
    // Chỉ user có subscription còn hạn mới dùng được
  }
}
```

**Ví dụ 2: Custom check trong service**

```typescript
@Injectable()
export class SomeService {
  constructor(private subscriptionPlanService: SubscriptionPlanService) {}

  async doSomething(userId: number) {
    const isActive =
      await this.subscriptionPlanService.isUserSubscriptionActive(userId);

    if (!isActive) {
      throw new ForbiddenException('Subscription required');
    }

    // Tiếp tục logic
  }
}
```

## Notes

- `expired_at` là null nếu chưa thanh toán thành công
- `sub_status` có thể là: 'ACTIVE', 'EXPIRED', 'INACTIVE', v.v.
- Guard sẽ tự động check cả điều kiện chưa đăng ký và hết hạn
