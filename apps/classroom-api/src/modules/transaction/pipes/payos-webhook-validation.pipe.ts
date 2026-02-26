import {
  BadRequestException,
  Injectable,
  Logger,
  PipeTransform,
} from '@nestjs/common';
import { PayOSWebhookDto } from '../dtos';
import { PayOSService } from '../payos.service';

@Injectable()
export class PayOSWebhookValidationPipe implements PipeTransform {
  private readonly logger = new Logger(PayOSWebhookValidationPipe.name);

  constructor(private payosService: PayOSService) {}

  async transform(value: any): Promise<PayOSWebhookDto> {
    // Validate structure first
    if (!value || typeof value !== 'object') {
      throw new BadRequestException('Invalid webhook payload structure');
    }

    // Verify signature before processing
    try {
      const webhook = {
        code: value.code || '00',
        desc: value.desc || 'Webhook received',
        success: value.success || true,
        data: value.data,
        signature: value.signature,
      };

      // Verify webhook signature with PayOS
      const verifiedData = await this.payosService.verifyWebhookData(
        webhook as any,
      );

      this.logger.debug(
        `✅ Webhook signature verified for order: ${verifiedData.orderCode}`,
      );

      return value as PayOSWebhookDto;
    } catch (error) {
      this.logger.error(
        `❌ Webhook signature verification failed: ${error.message}`,
      );
      throw new BadRequestException('Invalid webhook signature');
    }
  }
}
