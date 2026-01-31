import { Injectable } from '@nestjs/common';
import { PayOS } from '@payos/node';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';

@Injectable()
export class PaymentService {
  private payOS: PayOS;

  constructor(private readonly prisma: PrismaService) {
    this.payOS = new PayOS({
      clientId: process.env.PAYOS_CLIENT_ID!,
      apiKey: process.env.PAYOS_API_KEY!,
      checksumKey: process.env.PAYOS_CHECKSUM_KEY!,
    });
  }

  async createPayOSPayment(input: {
    userId: number;
    plan_id: number;
    amount: number;
  }) {
    const { userId, plan_id, amount } = input;
    const prisma = this.prisma as any;

    const plan = await prisma.subscription_plan.findUnique({
      where: { id: plan_id },
    });
    if (!plan) {
      throw new Error('Subscription plan not found');
    }
    const orderCode = Number(
      `${Date.now()}${Math.floor(Math.random() * 1000)}`,
    );
    const paymentData = {
      orderCode,
      amount,
      description: `Thanh toán gói ${plan.name}`,
      items: [
        {
          name: plan.name,
          quantity: 1,
          price: amount,
        },
      ],
      cancelUrl: `${process.env.FRONTEND_URL}/payment/cancel`,
      returnUrl: `${process.env.FRONTEND_URL}/payment/success`,
    };
    const paymentLink = await this.payOS.paymentRequests.create(paymentData);
    const payment = await prisma.transaction.create({
      data: {
        user_id: userId,
        plan_id,
        amount,
        payment_gateway: 'PAYOS',
        transaction_type: 'SUBSCRIPTION',
        status: 'PENDING',
        checkout_url: paymentLink.checkoutUrl,
        order_code: orderCode,
      },
    });

    return {
      message: 'Payment created successfully',
      data: this.mapToPaymentDetail(payment),
    };
  }

  private mapToPaymentDetail(transaction: any) {
    let pageSettings: unknown = null;
    try {
      pageSettings = transaction?.page_setting
        ? JSON.parse(transaction.page_setting)
        : null;
    } catch {
      pageSettings = null;
    }

    return {
      id: transaction.transaction_id,
      payment_gateway: transaction.payment_gateway,
      transaction_type: transaction.transaction_type,
      amount: transaction.amount,
      note: transaction.note,
      checkout_url: transaction.checkout_url,
      status: transaction.status,
      ownerId: transaction.owner_id,
      updatedAt: transaction.updated_at,
      currentVersionId: transaction.current_ver_id,
      pageSettings,
    };
  }
}
