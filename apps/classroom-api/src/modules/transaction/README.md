# Transaction Module with PayOS Integration

This module provides a complete transaction management system with PayOS payment gateway integration.

## Features

- **Transaction Management**: Create, read, update transactions
- **PayOS Integration**: Create payment links and handle webhooks
- **Payment Status Tracking**: Monitor payment statuses (PENDING, PROCESSING, COMPLETED, FAILED, EXPIRED, CANCELLED)
- **Webhook Verification**: Secure PayOS webhook handling with signature verification
- **User Credit System**: Automatically update user credits on successful payment

## Environment Variables

```env
# PayOS Configuration
PAYOS_CLIENT_ID=your_client_id
PAYOS_API_KEY=your_api_key
PAYOS_CHECKSUM_KEY=your_checksum_key

# Application
APP_URL=http://localhost:3000
```

## API Endpoints

### Transaction Management

#### Create Payment Link

```http
POST /transactions/payment-link
Content-Type: application/json

{
  "amount": 100000,
  "transaction_type": "DEPOSIT",
  "payment_gateway": "PAYOS",
  "buyer_name": "John Doe",
  "buyer_email": "john@example.com",
  "buyer_phone": "0912345678",
  "description": "Payment for course",
  "return_url": "http://localhost:3000/payment-success",
  "cancel_url": "http://localhost:3000/payment-cancel"
}

Response:
{
  "status": "success",
  "data": {
    "transaction_id": 1,
    "orderCode": 1234567890,
    "checkoutUrl": "https://pay.payos.vn/...",
    "paymentLinkId": "..."
  }
}
```

#### Create General Transaction

```http
POST /transactions
Content-Type: application/json

{
  "amount": 100000,
  "transaction_type": "DEPOSIT",
  "payment_gateway": "PAYOS",
  "note": "Top up credit"
}

Response:
{
  "status": "success",
  "data": {
    "transaction_id": 1,
    "user_id": 1,
    "amount": 100000,
    "transaction_type": "DEPOSIT",
    "payment_gateway": "PAYOS",
    "created_at": "2024-02-08T..."
  }
}
```

#### Get User Transactions

```http
GET /transactions/user?limit=10&offset=0
Authorization: Bearer <token>

Response:
{
  "status": "success",
  "data": {
    "data": [...],
    "total": 5,
    "limit": 10,
    "offset": 0
  }
}
```

#### Get Transaction by ID

```http
GET /transactions/:id

Response:
{
  "status": "success",
  "data": {
    "transaction_id": 1,
    ...
  }
}
```

#### Get Payment Information

```http
GET /transactions/payment-info/:orderCode

Response:
{
  "status": "success",
  "data": {
    "orderCode": 1234567890,
    "amount": 100000,
    "status": "COMPLETED",
    ...
  }
}
```

#### Update Transaction

```http
PUT /transactions/:id
Content-Type: application/json

{
  "note": "Updated note",
  "status": "COMPLETED"
}

Response:
{
  "status": "success",
  "data": {...}
}
```

#### Cancel Payment

```http
POST /transactions/cancel/:orderCode
Content-Type: application/json

{
  "reason": "User requested cancellation"
}

Response:
{
  "status": "success",
  "data": {...}
}
```

#### Get All Transactions (Admin)

```http
GET /transactions?limit=10&offset=0

Response:
{
  "status": "success",
  "data": {
    "data": [...],
    "total": 100,
    "limit": 10,
    "offset": 0
  }
}
```

### Webhook

#### PayOS Webhook

```http
POST /transactions/webhook/payos
Content-Type: application/json

{
  "data": {
    "orderCode": 1234567890,
    "amount": 100000,
    "status": "COMPLETED",
    "reference": "ABC123",
    ...
  },
  "signature": "..."
}

Response:
{
  "code": "00",
  "desc": "Webhook processed successfully",
  "success": true
}
```

## Webhook Configuration

### PayOS Webhook Setup Steps

1. Log in to your PayOS dashboard
2. Go to **Settings** → **Webhook Configuration**
3. Add webhook URL: `https://your-app-domain.com/transactions/webhook/payos`
4. Select events:
   - `payment.completed`
   - `payment.failed`
   - `payment.cancelled`
   - `payment.expired`
5. Save and test

## Payment Status Flow

```
PENDING → PROCESSING → COMPLETED
       ↓
       → FAILED
       ↓
       → CANCELLED
       ↓
       → EXPIRED
```

## Types and DTOs

### CreateTransactionDto

```typescript
{
  amount: number;                 // Required, > 0
  transaction_type: string;       // DEPOSIT, WITHDRAWAL, PAYMENT, REFUND
  payment_gateway: string;        // PAYOS, STRIPE, BANK_TRANSFER
  note?: string;
  order_code?: string;
  description?: string;
  return_url?: string;
  cancel_url?: string;
  buyer_name?: string;            // Required for PayOS
  buyer_email?: string;           // Required for PayOS
  buyer_phone?: string;           // Required for PayOS
}
```

### UpdateTransactionDto

```typescript
{
  note?: string;
  status?: PaymentStatus;
  order_code?: string;
}
```

### Payment Status Enum

```typescript
enum PaymentStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
}
```

### Payment Gateway Enum

```typescript
enum PaymentGateway {
  PAYOS = 'PAYOS',
  STRIPE = 'STRIPE',
  BANK_TRANSFER = 'BANK_TRANSFER',
}
```

### Transaction Type Enum

```typescript
enum TransactionType {
  DEPOSIT = 'DEPOSIT',
  WITHDRAWAL = 'WITHDRAWAL',
  PAYMENT = 'PAYMENT',
  REFUND = 'REFUND',
}
```

## Services

### TransactionService

Main service for transaction operations:

- `createTransaction(userId, dto)` - Create a transaction
- `createPaymentLink(userId, dto)` - Create PayOS payment link
- `getTransaction(id)` - Get transaction by ID
- `getUserTransactions(userId, limit, offset)` - Get user's transactions
- `updateTransaction(id, dto)` - Update transaction
- `handlePayOSWebhook(body)` - Process PayOS webhook
- `getPaymentInfo(orderCode)` - Get payment info from PayOS
- `cancelPayment(orderCode, reason)` - Cancel payment
- `getAllTransactions(limit, offset)` - Get all transactions

### PayOSService

PayOS integration service:

- `createPaymentLink(data)` - Create payment link
- `getPaymentInfo(orderCode)` - Get payment details
- `cancelPayment(orderCode, reason)` - Cancel payment
- `verifyWebhookSignature(data, signature)` - Verify webhook
- `verifyWebhookData(data, signature)` - Verify using built-in method
- `parseWebhookData(body)` - Parse and validate webhook
- `generateOrderCode()` - Generate unique order code

## Security

- All PayOS webhooks are verified with HMAC-SHA256 signature
- Order codes are generated with timestamp and random component
- User authentication required for user-specific endpoints
- Sensitive data is properly validated before processing

## Error Handling

The module provides comprehensive error handling:

- Invalid request validation
- Not found errors for missing resources
- Authentication errors for unauthorized access
- PayOS API error handling
- Webhook signature verification failures

## Integration Example

```typescript
// In your controller or service
constructor(private transactionService: TransactionService) {}

async buyCredit(userId: number, amount: number) {
  const transaction = await this.transactionService.createPaymentLink(
    userId,
    {
      amount,
      transaction_type: 'DEPOSIT',
      payment_gateway: 'PAYOS',
      buyer_name: 'John Doe',
      buyer_email: 'john@example.com',
      buyer_phone: '0912345678',
      description: 'Buy classroom credit',
      return_url: 'https://app.com/success',
      cancel_url: 'https://app.com/cancel',
    }
  );

  // Return checkout URL to user
  return transaction.checkoutUrl;
}
```

## Database Schema

```prisma
model transaction {
  transaction_id    Int       @id @default(autoincrement())
  user_id           Int?
  payment_gateway   String?   @db.VarChar(50)
  transaction_type  String?   @db.VarChar(50)
  amount            Decimal?  @db.Decimal(10, 2)
  note              String?
  created_at        DateTime? @default(now()) @db.Timestamp(6)
  USER              USER?     @relation(fields: [user_id], references: [user_id])
}
```

## Notes

- Order codes are unique and generated automatically
- Payment information is stored in transaction notes as JSON
- User credits are automatically updated on successful payment
- Webhook signature verification is mandatory for security
- PayOS API errors are caught and logged for debugging
