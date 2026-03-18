import {
  BadRequestException,
  Injectable,
  Logger,
  PipeTransform,
} from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { PayOSWebhookDataDto, PayOSWebhookDto } from '../dtos';
import { PayOSService } from '../payos.service';

@Injectable()
export class PayOSWebhookValidationPipe implements PipeTransform {
  private readonly logger = new Logger(PayOSWebhookValidationPipe.name);

  constructor(private payosService: PayOSService) {}

  async transform(value: any): Promise<PayOSWebhookDto> {
    // Validate structure first
    if (!value || typeof value !== 'object') {
      this.logger.error('Invalid webhook payload structure');
      this.logger.error(`Received: ${JSON.stringify(value)}`);
      throw new BadRequestException(
        'Invalid webhook payload structure - expected object',
      );
    }

    // Extract data and signature (ignore all other extra properties)
    const { data, signature } = value;

    this.logger.debug(
      `Webhook received with fields: ${Object.keys(value).join(', ')}`,
    );

    if (!data || typeof data !== 'object') {
      this.logger.error(
        `Missing or invalid data field. Received: ${JSON.stringify(value)}`,
      );
      throw new BadRequestException(
        'Missing or invalid data field - data must be an object',
      );
    }

    if (!signature || typeof signature !== 'string') {
      this.logger.error(
        `Missing or invalid signature. Data keys: ${Object.keys(data).join(', ')}`,
      );
      throw new BadRequestException(
        `Missing or invalid signature field - received: ${typeof signature}`,
      );
    }

    // Check required fields in data
    const requiredFields = [
      'orderCode',
      'amount',
      'status',
      'createdAt',
      'accountNumber',
    ];
    const missingFields = requiredFields.filter((field) => !data[field]);

    if (missingFields.length > 0) {
      this.logger.error(`Missing required fields: ${missingFields.join(', ')}`);
      this.logger.error(
        `Available data fields: ${Object.keys(data).join(', ')}`,
      );
      throw new BadRequestException(
        `Missing required fields in data: ${missingFields.join(', ')}`,
      );
    }

    // Verify signature with PayOS
    try {
      const webhookPayload = {
        code: '00',
        desc: 'Webhook received',
        success: true,
        data: data,
        signature: signature,
      };

      await this.payosService.verifyWebhookData(webhookPayload as any);

      this.logger.debug(
        `✅ Webhook signature verified for order: ${data.orderCode}`,
      );

      // Transform to proper DTO instances
      const webhookDataDto = plainToInstance(PayOSWebhookDataDto, data, {
        excludeExtraneousValues: true,
      });

      const webhookDto = plainToInstance(
        PayOSWebhookDto,
        {
          data: webhookDataDto,
          signature: signature,
        },
        { excludeExtraneousValues: true },
      );

      return webhookDto;
    } catch (error) {
      this.logger.error(
        `❌ Webhook signature verification failed: ${error.message}`,
      );
      this.logger.error(
        `📦 Request payload: ${JSON.stringify({
          orderCode: data?.orderCode,
          signature: signature?.substring(0, 10) + '...',
          dataFields: Object.keys(data || {}),
        })}`,
      );
      throw new BadRequestException(
        `Invalid webhook signature or payload: ${error.message}`,
      );
    }
  }
}
