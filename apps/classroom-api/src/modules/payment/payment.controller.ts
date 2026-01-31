import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PaymentService } from './payment.service';
@ApiTags('Payment')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('payment')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post('payOS')
  @ApiOperation({ summary: 'Create PayOS payment link' })
  @ApiResponse({ status: 201, description: 'PayOS checkout link created' })
  async createPayment(
    @Req() req: any,
    @Body() body: { plan_id: number; amount: number },
  ) {
    const user = req.user;

    return this.paymentService.createPayOSPayment({
      userId: user.userId, // 👈 lấy từ JWT
      plan_id: body.plan_id,
      amount: body.amount,
    });
  }
}
