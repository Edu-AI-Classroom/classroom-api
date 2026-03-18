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
import { PaymentGateway } from './types';

@Injectable()
export class TransactionService {
  private readonly logger = new Logger(TransactionService.name);

  constructor(
    private prisma: PrismaService,
    private payosService: PayOSService,
  ) {}

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
      const { orderCode, amount } = data;

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

      // Get subscription plan to calculate expired_at
      const subscriptionPlan = await this.prisma.subscription_plan.findUnique({
        where: { sub_code: transaction.sub_code },
      });

      // Calculate expired_at = created_at + duration_days
      let expiredAt: Date | null = null;
      if (subscriptionPlan && subscriptionPlan.duration_days) {
        expiredAt = new Date(transaction.created_at);
        expiredAt.setDate(expiredAt.getDate() + subscriptionPlan.duration_days);
      }

      // Update transaction status to PAID and save signature
      // Also update personal_info with subscription details and expired_at
      await Promise.all([
        this.prisma.transaction.update({
          where: { transaction_id: transaction.transaction_id },
          data: {
            status: 'PAID',
            signature: signature || '',
            updated_at: new Date(),
          },
        }),
        // Update personal_info with subscription
        subscriptionPlan
          ? this.prisma.personal_info.upsert({
              where: { user_id: transaction.user_id },
              update: {
                sub_id: subscriptionPlan.sub_id,
                sub_start_date: transaction.created_at,
                expired_at: expiredAt,
                sub_status: 'ACTIVE',
              },
              create: {
                user_id: transaction.user_id,
                sub_id: subscriptionPlan.sub_id,
                sub_start_date: transaction.created_at,
                expired_at: expiredAt,
                sub_status: 'ACTIVE',
              },
            })
          : Promise.resolve(),
        this.updateUserCredit(transaction.user_id, amount),
      ]);

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
   * Update user credit after successful payment
   */
  private async updateUserCredit(userId: number, amount: number) {
    try {
      await this.prisma.uSER.update({
        where: { user_id: userId },
        data: {
          credit: {
            increment: Math.floor(amount),
          },
        },
      });

      this.logger.log(`User ${userId} credit updated by ${amount}`);
    } catch (error) {
      this.logger.error(`Failed to update user credit: ${error.message}`);
      // Don't throw - log only
    }
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
