import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import {
  CreateTransactionDto,
  PayOSWebhookDto,
  UpdateTransactionDto,
} from './dtos';
import { PayOSService } from './payos.service';
import { PaymentGateway, PaymentStatus } from './types';

@Injectable()
export class TransactionService {
  private readonly logger = new Logger(TransactionService.name);

  constructor(
    private prisma: PrismaService,
    private payosService: PayOSService,
  ) {}

  private isSuccessfulPaymentStatus(status?: string | null) {
    if (!status) return false;
    const normalized = String(status).toUpperCase();
    return (
      normalized === PaymentStatus.COMPLETED ||
      normalized === 'PAID' ||
      normalized === 'SUCCESS'
    );
  }

  /**
   * Create a new transaction
   */
  async createTransaction(userId: number, dto: CreateTransactionDto) {
    try {
      if (dto.amount <= 0) {
        throw new BadRequestException('Amount must be greater than 0');
      }
      const subscriptionPlan = await this.prisma.subscription_plan.findUnique({
        where: { sub_id: dto.sub_id },
      });
      if (!subscriptionPlan) {
        throw new NotFoundException(
          `Subscription plan ${dto.sub_id} not found`,
        );
      }

      const createData: any = {
        user_id: userId,
        amount: dto.amount,
        transaction_type: dto.transaction_type,
        payment_gateway: dto.payment_gateway,
        note: dto.note || '',
        sub_code: subscriptionPlan.sub_code,
      };

      const transaction = await this.prisma.transaction.create({
        data: {
          USER: {
            connect: {
              user_id: userId, // ✅ ĐÚNG
            },
          },
          amount: dto.amount,
          transaction_type: dto.transaction_type,
          payment_gateway: dto.payment_gateway,
          note: dto.note || '',
          sub_code: subscriptionPlan.sub_code,
          status: 'PENDING',
        },
      });

      this.logger.log(
        `Transaction created: ${transaction.transaction_id} for user ${userId}`,
      );

      return transaction;
    } catch (error) {
      this.logger.error(`Failed to create transaction: ${error.message}`);
      throw error;
    }
  }

  /**
   * Create payment link with PayOS
   */
  async createPaymentLink(userId: number, dto: CreateTransactionDto) {
    try {
      if (dto.payment_gateway !== PaymentGateway.PAYOS) {
        throw new BadRequestException('Only PayOS is supported');
      }
      const user = await this.prisma.uSER.findUnique({
        where: { user_id: userId },
      });

      if (!user) {
        throw new NotFoundException(`User ${userId} not found`);
      }

      // Create transaction record
      const transaction = await this.createTransaction(userId, dto);

      // Generate order code
      const orderCode = this.payosService.generateOrderCode();

      // Create short description (max 25 chars)
      const shortDesc = dto.description
        ? dto.description.substring(0, 25)
        : 'Payment';

      // Create payment link with PayOS
      const paymentLink = await this.payosService.createPaymentLink({
        orderCode,
        amount: dto.amount,
        description: shortDesc,
        returnUrl: dto.return_url || process.env.PAYOS_RETURN_URL,
        cancelUrl: dto.cancel_url || process.env.PAYOS_CANCEL_URL,
        buyerName: user.user_name,
        buyerEmail: user.email,
      });

      // Update transaction with order code, signature and status
      await this.prisma.transaction.update({
        where: { transaction_id: transaction.transaction_id },
        data: {
          order_code: orderCode,
          signature: paymentLink.signature,
          note: JSON.stringify({
            orderCode,
            paymentLinkId: paymentLink.paymentLinkId,
            ...(transaction.note ? JSON.parse(transaction.note) : {}),
          }),
        },
      });

      this.logger.log(
        `Payment link created for transaction: ${transaction.transaction_id}`,
      );

      return {
        ...transaction,
        orderCode,
        checkoutUrl: paymentLink.checkoutUrl,
        paymentLinkId: paymentLink.paymentLinkId,
      };
    } catch (error) {
      this.logger.error(`Failed to create payment link: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get transaction by ID
   */
  async getTransaction(transactionId: number) {
    try {
      const transaction = await this.prisma.transaction.findUnique({
        where: { transaction_id: transactionId },
      });

      if (!transaction) {
        throw new NotFoundException(`Transaction ${transactionId} not found`);
      }

      return transaction;
    } catch (error) {
      this.logger.error(`Failed to get transaction: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get all transactions for a user
   */
  async getUserTransactions(userId: number, limit = 10, offset = 0) {
    try {
      const [transactions, total] = await Promise.all([
        this.prisma.transaction.findMany({
          where: { user_id: userId },
          take: limit,
          skip: offset,
          orderBy: { created_at: 'desc' },
        }),
        this.prisma.transaction.count({
          where: { user_id: userId },
        }),
      ]);

      return {
        data: transactions,
        total,
        limit,
        offset,
      };
    } catch (error) {
      this.logger.error(`Failed to get user transactions: ${error.message}`);
      throw error;
    }
  }

  /**
   * Update transaction
   */
  async updateTransaction(transactionId: number, dto: UpdateTransactionDto) {
    try {
      const transaction = await this.prisma.transaction.findUnique({
        where: { transaction_id: transactionId },
      });

      if (!transaction) {
        throw new NotFoundException(`Transaction ${transactionId} not found`);
      }

      const updated = await this.prisma.transaction.update({
        where: { transaction_id: transactionId },
        data: {
          note: dto.note !== undefined ? dto.note : transaction.note,
        },
      });

      this.logger.log(`Transaction ${transactionId} updated`);
      return updated;
    } catch (error) {
      this.logger.error(`Failed to update transaction: ${error.message}`);
      throw error;
    }
  }

  /**
   * Handle PayOS webhook
   * Updates transaction status based on PayOS payment status
   */
  async handlePayOSWebhook(webhookDto: PayOSWebhookDto) {
    try {
      if (!webhookDto || !webhookDto.data) {
        this.logger.error(
          `Invalid webhook payload: ${JSON.stringify(webhookDto)}`,
        );
        return {
          code: '01',
          desc: 'Invalid webhook payload',
          success: false,
        };
      }

      const { data, signature } = webhookDto;
      const { orderCode } = data;

      // Find transaction by orderCode
      const transaction = await this.prisma.transaction.findFirst({
        where: {
          order_code: orderCode?.toString(),
        },
      });

      if (!transaction) {
        this.logger.warn(`Transaction not found for orderCode: ${orderCode}`);
        return {
          code: '00',
          desc: 'Webhook processed',
          success: true,
        };
      }

      if (this.isSuccessfulPaymentStatus(transaction.status)) {
        this.logger.log(
          `Payment webhook ignored because transaction ${transaction.transaction_id} is already completed`,
        );
        return {
          code: '00',
          desc: 'Webhook processed successfully',
          success: true,
        };
      }

      await this.applySuccessfulPayment(transaction.transaction_id, signature);

      this.logger.log(
        `💰 Payment completed for transaction ${transaction.transaction_id}`,
      );

      return {
        code: '00',
        desc: 'Webhook processed successfully',
        success: true,
      };
    } catch (error) {
      this.logger.error(`Failed to handle PayOS webhook: ${error.message}`);
      return {
        code: '01',
        desc: error.message,
        success: false,
      };
    }
  }

  /**
   * Apply subscription entitlements after successful payment
   */
  private async applySuccessfulPayment(
    transactionId: number,
    signature?: string,
  ) {
    await this.prisma.$transaction(async (tx: any) => {
      const transaction = await tx.transaction.findUnique({
        where: { transaction_id: transactionId },
      });

      if (!transaction) {
        throw new NotFoundException(`Transaction ${transactionId} not found`);
      }

      if (this.isSuccessfulPaymentStatus(transaction.status)) {
        return;
      }

      if (!transaction.user_id) {
        throw new BadRequestException(
          `Transaction ${transactionId} has no user_id`,
        );
      }

      if (!transaction.sub_code) {
        throw new BadRequestException(
          `Transaction ${transactionId} has no subscription code`,
        );
      }

      const subscriptionPlan = await tx.subscription_plan.findUnique({
        where: { sub_code: transaction.sub_code },
      });

      if (!subscriptionPlan) {
        throw new NotFoundException(
          `Subscription plan ${transaction.sub_code} not found`,
        );
      }

      const now = new Date();
      const aiTokenGrant = Math.max(subscriptionPlan.ai_token_limit ?? 0, 0);

      await tx.transaction.update({
        where: { transaction_id: transaction.transaction_id },
        data: {
          status: PaymentStatus.COMPLETED,
          signature: signature || transaction.signature || '',
          updated_at: now,
        },
      });

      await tx.uSER.update({
        where: { user_id: transaction.user_id },
        data: {
          credit: {
            increment: aiTokenGrant,
          },
          updated_at: now,
        },
      });

      await tx.personal_info.upsert({
        where: { user_id: transaction.user_id },
        create: {
          user_id: transaction.user_id,
          sub_id: subscriptionPlan.sub_id,
          sub_start_date: now,
          sub_status: 'ACTIVE',
        },
        update: {
          sub_id: subscriptionPlan.sub_id,
          sub_start_date: now,
          sub_status: 'ACTIVE',
        },
      });

      this.logger.log(
        `Applied subscription ${subscriptionPlan.sub_code} to user ${transaction.user_id}: +${aiTokenGrant} AI tokens, max classes ${subscriptionPlan.max_classes ?? 'unlimited'}`,
      );
    });
  }

  async confirmPaymentSuccess(orderCode: string, userId?: number) {
    const transaction = await this.prisma.transaction.findFirst({
      where: {
        order_code: orderCode,
        ...(userId ? { user_id: userId } : {}),
      },
    });

    if (!transaction) {
      throw new NotFoundException(
        `Transaction for order ${orderCode} not found`,
      );
    }

    if (this.isSuccessfulPaymentStatus(transaction.status)) {
      return {
        transactionId: transaction.transaction_id,
        orderCode,
        status: PaymentStatus.COMPLETED,
        alreadyCompleted: true,
      };
    }

    const paymentInfo = await this.payosService.getPaymentInfo(orderCode);
    const paymentStatus = (paymentInfo as any)?.status;

    if (!this.isSuccessfulPaymentStatus(paymentStatus)) {
      return {
        transactionId: transaction.transaction_id,
        orderCode,
        status: paymentStatus ?? transaction.status ?? PaymentStatus.PENDING,
        alreadyCompleted: false,
      };
    }

    await this.applySuccessfulPayment(transaction.transaction_id);

    return {
      transactionId: transaction.transaction_id,
      orderCode,
      status: PaymentStatus.COMPLETED,
      alreadyCompleted: false,
    };
  }

  /**
   * Get payment info from PayOS
   */
  async getPaymentInfo(orderCode: string) {
    try {
      const info = await this.payosService.getPaymentInfo(orderCode);
      return info;
    } catch (error) {
      this.logger.error(`Failed to get payment info: ${error.message}`);
      throw error;
    }
  }

  /**
   * Cancel payment
   */
  async cancelPayment(orderCode: string, reason?: string) {
    try {
      // Call PayOS API to cancel
      const payosResult = await this.payosService.cancelPayment(
        orderCode,
        reason,
      );
      this.logger.log(`Payment ${orderCode} cancelled in PayOS`);

      // Find and update transaction in DB
      const transaction = await this.prisma.transaction.findFirst({
        where: {
          note: {
            contains: orderCode.toString(),
          },
        },
      });

      if (transaction) {
        await this.prisma.transaction.update({
          where: { transaction_id: transaction.transaction_id },
          data: {
            status: 'CANCELLED',
            updated_at: new Date(),
          },
        });
        this.logger.log(
          `⚠️  Transaction ${transaction.transaction_id} updated to CANCELLED in DB`,
        );
      }

      return payosResult;
    } catch (error) {
      this.logger.error(`Failed to cancel payment: ${error.message}`);
      throw error;
    }
  }

  /**
   * Handle payment failed callback from PayOS
   */
  async handlePaymentFailed(orderCode: string, status?: string) {
    try {
      // Find transaction by order code
      const transaction = await this.prisma.transaction.findFirst({
        where: {
          note: {
            contains: orderCode.toString(),
          },
        },
      });

      if (!transaction) {
        this.logger.warn(`Transaction not found for order: ${orderCode}`);
        return null;
      }

      // Update transaction status to CANCELLED
      const updatedTransaction = await this.prisma.transaction.update({
        where: { transaction_id: transaction.transaction_id },
        data: {
          status: status || 'CANCELLED',
          updated_at: new Date(),
        },
      });

      this.logger.log(
        `⚠️  Payment failed/cancelled for transaction ${transaction.transaction_id}, orderCode: ${orderCode}`,
      );

      return updatedTransaction;
    } catch (error) {
      this.logger.error(`Failed to handle payment failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get all transactions (admin)
   */
  async getAllTransactions(limit = 10, offset = 0) {
    try {
      const [transactions, total] = await Promise.all([
        this.prisma.transaction.findMany({
          take: limit,
          skip: offset,
          orderBy: { created_at: 'desc' },
        }),
        this.prisma.transaction.count(),
      ]);

      return {
        data: transactions,
        total,
        limit,
        offset,
      };
    } catch (error) {
      this.logger.error(`Failed to get all transactions: ${error.message}`);
      throw error;
    }
  }
}
