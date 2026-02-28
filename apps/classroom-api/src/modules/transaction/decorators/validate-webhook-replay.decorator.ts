import {
  BadRequestException,
  createParamDecorator,
  ExecutionContext,
} from '@nestjs/common';

// In-memory store for recent webhook IDs (in production, use Redis)
const processedWebhooks = new Map<string, number>();
const WEBHOOK_TIMEOUT = 5 * 60 * 1000; // 5 minutes
const CLEANUP_INTERVAL = 10 * 60 * 1000; // 10 minutes

// Cleanup old entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, timestamp] of processedWebhooks.entries()) {
    if (now - timestamp > WEBHOOK_TIMEOUT) {
      processedWebhooks.delete(key);
    }
  }
}, CLEANUP_INTERVAL);

export const ValidateWebhookReplay = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const body = request.body;

    if (!body || !body.data) {
      throw new BadRequestException('Invalid webhook payload');
    }

    // Create a unique key from order code + transaction date to prevent replay
    const webhookKey = `${body.data.orderCode}-${body.data.transactionDateTime}`;

    if (processedWebhooks.has(webhookKey)) {
      const lastProcessedTime = processedWebhooks.get(webhookKey);
      const timeSinceLastProcess = Date.now() - lastProcessedTime;

      if (timeSinceLastProcess < 1000) {
        // Same webhook received within 1 second
        throw new BadRequestException('Duplicate webhook request detected');
      }
    }

    // Mark this webhook as processed
    processedWebhooks.set(webhookKey, Date.now());

    return {
      orderCode: body.data.orderCode,
      timestamp: body.data.transactionDateTime,
      key: webhookKey,
    };
  },
);

/**
 * For production use, implement this with Redis:
 *
 * @Injectable()
 * export class WebhookReplayDetectionService {
 *   constructor(private redis: RedisService) {}
 *
 *   async isProcessed(webhookKey: string): Promise<boolean> {
 *     return await this.redis.exists(webhookKey);
 *   }
 *
 *   async markProcessed(webhookKey: string, ttl = 300): Promise<void> {
 *     await this.redis.setex(webhookKey, ttl, '1');
 *   }
 * }
 */
