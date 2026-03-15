import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  CreatePaymentLinkResponse,
  PaymentLink,
  PayOS,
  Webhook,
  WebhookData,
} from '@payos/node';
import * as crypto from 'crypto';
import { PayOSInitiateData, PayOSPaymentStatus } from './types/payos.type';

@Injectable()
export class PayOSService {
  private payos: PayOS;
  private readonly logger = new Logger(PayOSService.name);
  private readonly clientId: string;
  private readonly apiKey: string;
  private readonly checksumKey: string;

  constructor(private configService: ConfigService) {
    this.clientId = this.configService.get<string>('PAYOS_CLIENT_ID', '');
    this.apiKey = this.configService.get<string>('PAYOS_API_KEY', '');
    this.checksumKey = this.configService.get<string>('PAYOS_CHECKSUM_KEY', '');

    if (!this.clientId || !this.apiKey || !this.checksumKey) {
      this.logger.warn('PayOS configuration is incomplete');
    }

    this.payos = new PayOS({
      clientId: this.clientId,
      apiKey: this.apiKey,
      checksumKey: this.checksumKey,
    });
  }

  /**
   * Create a payment link with PayOS and generate signature
   */
  async createPaymentLink(
    data: PayOSInitiateData,
  ): Promise<CreatePaymentLinkResponse & { signature: string }> {
    try {
      const payload = {
        orderCode: Number(data.orderCode),
        amount: data.amount,
        description: data.description,
        returnUrl: data.returnUrl,
        cancelUrl: data.cancelUrl,
        buyerName: data.buyerName,
        buyerEmail: data.buyerEmail,
        signature: '',
      };

      const result = await this.payos.paymentRequests.create(payload);

      // Generate signature for this payment link
      const signature = this.generatePaymentLinkSignature({
        orderCode: data.orderCode,
        amount: data.amount,
        description: data.description,
      });

      this.logger.log(`Payment link created: ${data.orderCode}`);
      return { ...result, signature };
    } catch (error) {
      this.logger.error(`Failed to create payment link: ${error.message}`);
      throw error;
    }
  }

  /**
   * Generate signature for payment link data
   */
  private generatePaymentLinkSignature(data: {
    orderCode: string;
    amount: number;
    description: string;
  }): string {
    const signatureData = JSON.stringify(data);
    const signature = crypto
      .createHmac('sha256', this.checksumKey)
      .update(signatureData)
      .digest('hex');
    return signature;
  }

  /**
   * Get payment information by order code
   */
  async getPaymentInfo(orderCode: string): Promise<PaymentLink> {
    try {
      const result = await this.payos.paymentRequests.get(orderCode);
      return result;
    } catch (error) {
      this.logger.error(
        `Failed to get payment info for order ${orderCode}: ${error.message}`,
      );
      throw error;
    }
  }

  /**
   * Cancel a payment link
   */
  async cancelPayment(orderCode: string, reason?: string): Promise<any> {
    try {
      const result = await this.payos.paymentRequests.cancel(orderCode, reason);
      this.logger.log(`Payment cancelled: ${orderCode}`);
      return result;
    } catch (error) {
      this.logger.error(
        `Failed to cancel payment ${orderCode}: ${error.message}`,
      );
      throw error;
    }
  }

  /**
   * Verify webhook signature using PayOS built-in method
   */
  async verifyWebhookData(webhook: Webhook): Promise<WebhookData> {
    try {
      const data = await this.payos.webhooks.verify(webhook);
      return data;
    } catch (error) {
      this.logger.error(`Invalid PayOS webhook signature: ${error.message}`);
      throw error; // để controller quyết định response
    }
  }

  /**
   * Parse webhook data and validate
   */
  async parseWebhookData(body: any): Promise<{
    isValid: boolean;
    data?: WebhookData;
    error?: string;
  }> {
    try {
      if (!body) {
        return { isValid: false, error: 'Empty body' };
      }

      const webhook: Webhook = {
        code: body.code,
        desc: body.desc,
        success: body.success,
        data: body.data,
        signature: body.signature,
      };

      const data = await this.verifyWebhookData(webhook);

      return {
        isValid: true,
        data,
      };
    } catch (error) {
      return {
        isValid: false,
        error: error.message,
      };
    }
  }

  /**
   * Check payment status (PENDING, PROCESSING, COMPLETED, FAILED, EXPIRED, CANCELLED)
   */
  getPaymentStatusDescription(status: PayOSPaymentStatus): string {
    const statusMap = {
      [PayOSPaymentStatus.PENDING]: 'Pending Payment',
      [PayOSPaymentStatus.PROCESSING]: 'Processing Payment',
      [PayOSPaymentStatus.COMPLETED]: 'Payment Completed',
      [PayOSPaymentStatus.FAILED]: 'Payment Failed',
      [PayOSPaymentStatus.EXPIRED]: 'Payment Link Expired',
      [PayOSPaymentStatus.CANCELLED]: 'Payment Cancelled',
    };

    return statusMap[status] || 'Unknown Status';
  }

  /**
   * Generate order code (timestamp + random)
   */
  generateOrderCode(): string {
    return String(
      Math.floor(Date.now() / 1000) * 100 + Math.floor(Math.random() * 100),
    );
  }
}
