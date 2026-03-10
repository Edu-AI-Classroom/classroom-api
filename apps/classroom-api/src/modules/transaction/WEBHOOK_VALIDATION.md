# PayOS Webhook Validation Guide

## Overview

The webhook validation system for PayOS integrates multiple layers of security and data validation to ensure webhook integrity and prevent abuse.

## Validation Layers

### 1. **DTO Validation** (`payos-webhook.dto.ts`)

#### PayOSWebhookDataDto - Required Fields:

| Field                 | Type   | Validation                  | Description                                                                    |
| --------------------- | ------ | --------------------------- | ------------------------------------------------------------------------------ |
| `orderCode`           | number | Min: 1, Required            | Unique order identifier                                                        |
| `amount`              | number | Min: 1, Required            | Payment amount (must be > 0)                                                   |
| `description`         | string | Required                    | Payment description                                                            |
| `accountNumber`       | string | Required                    | Receiver bank account                                                          |
| `reference`           | string | Required                    | Reference/tracking number                                                      |
| `transactionDateTime` | string | ISO 8601 format, Required   | Transaction timestamp                                                          |
| `currency`            | string | 3-letter ISO code, Required | Currency code (e.g., VND, USD)                                                 |
| `counterPartyCode`    | string | Required                    | Payer bank code                                                                |
| `counterPartyName`    | string | Required                    | Payer name                                                                     |
| `paymentLinkId`       | string | Required                    | PayOS payment link ID                                                          |
| `code`                | string | Required                    | Response code                                                                  |
| `status`              | enum   | Required                    | One of: `PENDING`, `PROCESSING`, `COMPLETED`, `FAILED`, `EXPIRED`, `CANCELLED` |
| `bookingId`           | string | Required                    | Booking/reservation ID                                                         |
| `createdAt`           | string | ISO 8601 format, Required   | Link creation timestamp                                                        |

#### Optional Fields:

- `paymentMethodId` (number) - Payment method identifier
- `paymentMethodName` (string) - Payment method name
- `cancelledAt` (string, ISO 8601) - Cancellation timestamp
- `expiredAt` (string, ISO 8601) - Expiration timestamp

#### PayOSWebhookDto - Root Level:

| Field       | Type                | Validation                                  |
| ----------- | ------------------- | ------------------------------------------- |
| `data`      | PayOSWebhookDataDto | Nested validation                           |
| `signature` | string              | SHA256 hash format (64 hex chars), Required |

### 2. **Signature Verification** (`PayOSWebhookValidationPipe`)

The webhook validation pipe verifies the HMAC-SHA256 signature using the PayOS checksum key:

```typescript
// Signature verification process:
1. Extract signature from webhook
2. Reconstruct payload with known fields
3. Calculate HMAC-SHA256 with PAYOS_CHECKSUM_KEY
4. Compare calculated signature with received signature
5. Reject if signatures don't match
```

**Error Response if signature verification fails:**

```json
{
  "statusCode": 400,
  "message": "Invalid webhook signature",
  "error": "Bad Request"
}
```

### 3. **Replay Attack Detection** (`ValidateWebhookReplay`)

Prevents processing the same webhook multiple times:

```typescript
// Unique key: orderCode + transactionDateTime
// Detection: Checks if webhook was processed in last 5 minutes
// Storage: In-memory Map (should use Redis in production)
```

**Error Response if duplicate detected:**

```json
{
  "statusCode": 400,
  "message": "Duplicate webhook request detected",
  "error": "Bad Request"
}
```

### 4. **Service-Level Validation** (`TransactionService.handlePayOSWebhook`)

Additional business logic validation:

- Transaction lookup by order code
- Payment status mapping
- Database record updates
- User balance calculations

## Testing the Webhook

### Sample Valid Payload

```json
{
  "code": "00",
  "desc": "Webhook received",
  "success": true,
  "data": {
    "orderCode": 1708592471234,
    "amount": 100000,
    "description": "Thanh toán khóa học",
    "accountNumber": "1234567890",
    "reference": "TXN2025022200001",
    "transactionDateTime": "2026-02-22T10:30:45",
    "currency": "VND",
    "paymentMethodId": 1,
    "paymentMethodName": "Bank Transfer",
    "counterPartyCode": "970418",
    "counterPartyName": "John Doe",
    "paymentLinkId": "link_abc123xyz",
    "code": "00",
    "status": "COMPLETED",
    "bookingId": "BK20260222001",
    "createdAt": "2026-02-22T09:00:00",
    "cancelledAt": null,
    "expiredAt": null
  },
  "signature": "a1b2c3d4e5f6... (64 character SHA256 hash)"
}
```

### Test with cURL

```bash
curl -X POST http://localhost:3000/transactions/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "code": "00",
    "desc": "Webhook received",
    "success": true,
    "data": {
      "orderCode": 1708592471234,
      "amount": 100000,
      "description": "Thanh toán khóa học",
      "accountNumber": "1234567890",
      "reference": "TXN2025022200001",
      "transactionDateTime": "2026-02-22T10:30:45",
      "currency": "VND",
      "counterPartyCode": "970418",
      "counterPartyName": "John Doe",
      "paymentLinkId": "link_abc123xyz",
      "code": "00",
      "status": "COMPLETED",
      "bookingId": "BK20260222001",
      "createdAt": "2026-02-22T09:00:00"
    },
    "signature": "a1b2c3d4e5f6..."
  }'
```

## Response Codes

### Success (HTTP 200)

```json
{
  "status": "success",
  "data": {
    "transaction_id": 123,
    "status": "completed",
    "message": "Payment confirmed"
  }
}
```

### Validation Error (HTTP 400)

```json
{
  "statusCode": 400,
  "message": "Invalid webhook payload structure",
  "error": "Bad Request"
}
```

### Signature Error (HTTP 400)

```json
{
  "statusCode": 400,
  "message": "Invalid webhook signature",
  "error": "Bad Request"
}
```

## Common Validation Errors

| Error                                            | Cause                        | Solution                                   |
| ------------------------------------------------ | ---------------------------- | ------------------------------------------ |
| `orderCode must be greater than 0`               | Invalid order code           | Ensure orderCode is positive integer       |
| `amount must be greater than 0`                  | Invalid amount               | Ensure amount is positive number           |
| `signature must be a valid SHA256 hash`          | Signature format invalid     | Verify signature format (64 hex chars)     |
| `transactionDateTime must be in ISO 8601 format` | Invalid date format          | Use `YYYY-MM-DDTHH:mm:ss` format           |
| `currency must be a 3-letter ISO code`           | Invalid currency             | Use 3-letter ISO codes (VND, USD, etc)     |
| `status must be one of: ...`                     | Invalid status enum          | Use valid PayOS status values              |
| `Invalid webhook signature`                      | Checksum verification failed | Verify PAYOS_CHECKSUM_KEY is correct       |
| `Duplicate webhook request detected`             | Replay attack prevention     | Same webhook received twice within timeout |

## Production Recommendations

1. **Use Redis for Replay Detection**
   - Replace in-memory Map with Redis store
   - Set TTL to 30 minutes
   - Distribute across multiple servers

2. **Enable Rate Limiting**

   ```typescript
   @UseGuards(ThrottlerGuard)
   @Throttle(10, 60) // 10 requests per minute
   async handlePayOSWebhook(...) {}
   ```

3. **Use Environment Variables**
   - Store PAYOS_CHECKSUM_KEY securely
   - Use .env.local for local development
   - Rotate keys regularly

4. **Add Logging**
   - Log all webhook requests with timestamp
   - Log signature verification results
   - Monitor for suspicious patterns

5. **Database Transactions**
   - Use database transactions for atomicity
   - Rollback on payment status conflicts
   - Log transaction history

6. **Idempotency**
   - Store processed webhook IDs in database
   - Check before making state changes
   - Return cached response for duplicates

7. **Monitoring & Alerts**
   - Monitor webhook success rate
   - Alert on signature failures
   - Track payment status mismatches

## Security Checklist

- [x] Signature verification enabled
- [x] Replay attack detection implemented
- [x] Input validation enforced
- [x] Error messages don't leak sensitive data
- [x] Webhook endpoint is public (no auth required)
- [ ] Rate limiting configured (TODO: production)
- [ ] Redis integration for scalability (TODO: production)
- [ ] Webhook logs retention policy (TODO: define)
- [ ] Incident response procedure (TODO: document)
