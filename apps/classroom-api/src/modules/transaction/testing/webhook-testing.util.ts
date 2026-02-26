/**
 * Webhook testing utility
 * Helps generate valid webhook payloads with proper signatures for testing
 *
 * Usage in Jest tests:
 * const payload = generateValidWebhookPayload({
 *   orderCode: 1708592471234,
 *   amount: 50000,
 *   status: 'COMPLETED'
 * });
 */

import * as crypto from 'crypto';
import { PayOSPaymentStatus } from '../types/payos.type';

export interface WebhookPayloadOptions {
  orderCode?: number;
  amount?: number;
  description?: string;
  status?: PayOSPaymentStatus;
  accountNumber?: string;
  reference?: string;
  transactionDateTime?: string;
  currency?: string;
  counterPartyCode?: string;
  counterPartyName?: string;
  paymentLinkId?: string;
  bookingId?: string;
  createdAt?: string;
  cancelledAt?: string | null;
  expiredAt?: string | null;
}

/**
 * Generate a valid webhook payload with optional overrides
 */
export function generateValidWebhookPayload(
  options: WebhookPayloadOptions = {},
): any {
  const currentDateTime = new Date().toISOString().split('.')[0];

  const payload = {
    code: '00',
    desc: 'Webhook received',
    success: true,
    data: {
      orderCode: options.orderCode || Math.floor(Date.now() / 1000) * 100,
      amount: options.amount || 100000,
      description: options.description || 'Thanh toán khóa học',
      accountNumber: options.accountNumber || '1234567890',
      reference: options.reference || `TXN${Date.now()}`,
      transactionDateTime: options.transactionDateTime || currentDateTime,
      currency: options.currency || 'VND',
      paymentMethodId: 1,
      paymentMethodName: 'Bank Transfer',
      counterPartyCode: options.counterPartyCode || '970418',
      counterPartyName: options.counterPartyName || 'John Doe',
      paymentLinkId:
        options.paymentLinkId ||
        `link_${Math.random().toString(36).substring(7)}`,
      code: '00',
      status: options.status || PayOSPaymentStatus.COMPLETED,
      bookingId: options.bookingId || `BK${Date.now()}`,
      createdAt: options.createdAt || currentDateTime,
      cancelledAt: options.cancelledAt ?? null,
      expiredAt: options.expiredAt ?? null,
    },
  };

  // To calculate signature, you need PAYOS_CHECKSUM_KEY
  // Signature = HMAC-SHA256(JSON.stringify(data), checksumKey)
  // For testing, you should mock or provide the actual checksum key

  return payload;
}

/**
 * Generate webhook signature
 * Use the actual PAYOS_CHECKSUM_KEY from your environment
 */
export function generateWebhookSignature(
  data: any,
  checksumKey: string,
): string {
  const payloadString = JSON.stringify(data);
  const signature = crypto
    .createHmac('sha256', checksumKey)
    .update(payloadString)
    .digest('hex');

  return signature;
}

/**
 * Generate a complete valid webhook payload with signature
 */
export function generateValidWebhookPayloadWithSignature(
  checksumKey: string,
  options: WebhookPayloadOptions = {},
): any {
  const payload = generateValidWebhookPayload(options);
  const signature = generateWebhookSignature(payload.data, checksumKey);

  return {
    ...payload,
    signature,
  };
}

/**
 * Test wallet addresses for different payment methods
 */
export const PAYOS_TEST_DATA = {
  bankAccounts: [
    {
      bankCode: '970418', // VietComBank
      accountNumber: '1234567890',
      accountName: 'Test Account 1',
    },
    {
      bankCode: '970407', // Vietinbank
      accountNumber: '0987654321',
      accountName: 'Test Account 2',
    },
    {
      bankCode: '970416', // AgriBank
      accountNumber: '1122334455',
      accountName: 'Test Account 3',
    },
  ],

  statusProgression: [
    PayOSPaymentStatus.PENDING,
    PayOSPaymentStatus.PROCESSING,
    PayOSPaymentStatus.COMPLETED,
  ],

  failureStatuses: [
    PayOSPaymentStatus.FAILED,
    PayOSPaymentStatus.EXPIRED,
    PayOSPaymentStatus.CANCELLED,
  ],

  currencies: ['VND', 'USD', 'SGD'],
};

/**
 * Example: Generate webhook for different scenarios
 */
export const WEBHOOK_SCENARIOS = {
  // Successful payment completed
  successfulPayment: (): any => {
    return generateValidWebhookPayload({
      status: PayOSPaymentStatus.COMPLETED,
      amount: 50000,
    });
  },

  // Payment pending
  pendingPayment: (): any => {
    return generateValidWebhookPayload({
      status: PayOSPaymentStatus.PENDING,
      amount: 75000,
    });
  },

  // Payment failed
  failedPayment: (): any => {
    return generateValidWebhookPayload({
      status: PayOSPaymentStatus.FAILED,
      amount: 25000,
    });
  },

  // Payment cancelled by user
  cancelledPayment: (): any => {
    return generateValidWebhookPayload({
      status: PayOSPaymentStatus.CANCELLED,
      amount: 100000,
      cancelledAt: new Date().toISOString().split('.')[0],
    });
  },

  // Payment link expired
  expiredPayment: (): any => {
    return generateValidWebhookPayload({
      status: PayOSPaymentStatus.EXPIRED,
      amount: 150000,
      expiredAt: new Date().toISOString().split('.')[0],
    });
  },

  // Payment processing
  processingPayment: (): any => {
    return generateValidWebhookPayload({
      status: PayOSPaymentStatus.PROCESSING,
      amount: 200000,
    });
  },
};

/**
 * Jest test helper
 */
export class WebhookTestHelper {
  constructor(private checksumKey: string) {}

  /**
   * Generate payload for a completed payment
   */
  generateCompletedPayment(overrides: WebhookPayloadOptions = {}) {
    return generateValidWebhookPayloadWithSignature(this.checksumKey, {
      status: PayOSPaymentStatus.COMPLETED,
      ...overrides,
    });
  }

  /**
   * Generate payload for a failed payment
   */
  generateFailedPayment(overrides: WebhookPayloadOptions = {}) {
    return generateValidWebhookPayloadWithSignature(this.checksumKey, {
      status: PayOSPaymentStatus.FAILED,
      ...overrides,
    });
  }

  /**
   * Generate payload with invalid signature
   */
  generateWithInvalidSignature(overrides: WebhookPayloadOptions = {}) {
    const payload = generateValidWebhookPayload(overrides);
    return {
      ...payload,
      signature: 'invalid_signature_' + 'a'.repeat(48), // Invalid signature
    };
  }

  /**
   * Generate payload with missing required field
   */
  generateWithMissingField(
    fieldToRemove: string,
    overrides: WebhookPayloadOptions = {},
  ) {
    const payload = generateValidWebhookPayload(overrides);
    delete (payload.data as any)[fieldToRemove];
    return payload;
  }

  /**
   * Generate payload with invalid field value
   */
  generateWithInvalidField(
    fieldName: string,
    invalidValue: any,
    overrides: WebhookPayloadOptions = {},
  ) {
    const payload = generateValidWebhookPayload(overrides);
    (payload.data as any)[fieldName] = invalidValue;
    return payload;
  }
}
