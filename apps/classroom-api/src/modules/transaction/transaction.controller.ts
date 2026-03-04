import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Logger,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiExcludeEndpoint,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ValidateWebhookReplay } from './decorators/validate-webhook-replay.decorator';
import {
  CreateTransactionDto,
  PayOSWebhookDto,
  UpdateTransactionDto,
} from './dtos';
import { PayOSWebhookValidationPipe } from './pipes';
import { TransactionService } from './transaction.service';

@ApiTags('Payment & Transactions')
@Controller('transactions')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
export class TransactionController {
  private readonly logger = new Logger(TransactionController.name);

  constructor(private transactionService: TransactionService) {}

  /**
   * Create payment link with PayOS
   * POST /transactions/payment-link
   */
  @Post('payment-link')
  @ApiOperation({ summary: 'Tạo liên kết thanh toán PayOS' })
  @ApiBody({ type: CreateTransactionDto })
  @ApiResponse({
    status: 201,
    description: 'Tạo liên kết thanh toán thành công',
  })
  @ApiResponse({ status: 400, description: 'Yêu cầu không hợp lệ' })
  @ApiResponse({ status: 401, description: 'Chưa xác thực' })
  async createPaymentLink(
    @CurrentUser() user: any,
    @Body() dto: CreateTransactionDto,
  ) {
    try {
      this.logger.log('Create payment link called');
      this.logger.debug(`User from token: ${JSON.stringify(user)}`);
      this.logger.debug(`Body: ${JSON.stringify(dto)}`);
      if (!user?.userId) {
        this.logger.warn('User not authenticated');
        throw new BadRequestException('User not authenticated');
      }

      const result = await this.transactionService.createPaymentLink(
        user.userId,
        dto,
      );

      return {
        status: 'success',
        data: result,
      };
    } catch (error) {
      this.logger.error(`Failed to create payment link: ${error.message}`);
      throw new BadRequestException(error.message);
    }
  }

  /**
   * PayOS Webhook endpoint
   * POST /transactions/webhook
   * Receives payment status updates from PayOS
   */
  @Public()
  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  @ApiExcludeEndpoint()
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async handlePayOSWebhook(
    @Body(PayOSWebhookValidationPipe) webhookDto: PayOSWebhookDto,
    @ValidateWebhookReplay() replayInfo: any,
  ) {
    try {
      this.logger.log('Received PayOS webhook');
      this.logger.log(
        `📦 Webhook payload: OrderCode=${webhookDto.data.orderCode}, Status=${webhookDto.data.status}`,
      );
      this.logger.debug(`Replay check: ${JSON.stringify(replayInfo)}`);

      return await this.transactionService.handlePayOSWebhook(webhookDto);
    } catch (error) {
      this.logger.error(`Webhook error: ${error.message}`);

      return {
        code: '01',
        desc: error.message,
        success: false,
      };
    }
  }

  /**
   * Create transaction (general)
   * POST /transactions
   */
  @Post()
  @ApiOperation({ summary: 'Tạo giao dịch mới' })
  @ApiBody({ type: CreateTransactionDto })
  @ApiResponse({ status: 201, description: 'Tạo giao dịch thành công' })
  @ApiResponse({ status: 400, description: 'Yêu cầu không hợp lệ' })
  @ApiResponse({ status: 401, description: 'Chưa xác thực' })
  async createTransaction(
    @CurrentUser() user: any,
    @Body() dto: CreateTransactionDto,
  ) {
    try {
      if (!user?.sub) {
        throw new BadRequestException('User not authenticated');
      }

      const transaction = await this.transactionService.createTransaction(
        user.user_id,
        dto,
      );

      return {
        status: 'success',
        data: transaction,
      };
    } catch (error) {
      this.logger.error(`Failed to create transaction: ${error.message}`);
      return {
        status: 'error',
        message: error.message,
      };
    }
  }

  /**
   * Get user transactions
   * GET /transactions/user
   */
  @Get('user')
  @ApiOperation({ summary: 'Lấy danh sách giao dịch của người dùng' })
  @ApiResponse({ status: 200, description: 'Danh sách giao dịch' })
  @ApiResponse({ status: 401, description: 'Chưa xác thực' })
  async getUserTransactions(
    @CurrentUser() user: any,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    try {
      if (!user?.user_id) {
        throw new BadRequestException('User not authenticated');
      }

      const limitNum = limit ? parseInt(limit, 10) : 10;
      const offsetNum = offset ? parseInt(offset, 10) : 0;

      const result = await this.transactionService.getUserTransactions(
        user.user_id,
        limitNum,
        offsetNum,
      );

      return {
        status: 'success',
        data: result,
      };
    } catch (error) {
      this.logger.error(`Failed to get user transactions: ${error.message}`);
      return {
        status: 'error',
        message: error.message,
      };
    }
  }

  /**
   * Get transaction by ID
   * GET /transactions/:id
   */
  @Get(':id')
  @ApiOperation({ summary: 'Lấy thông tin giao dịch theo ID' })
  @ApiResponse({ status: 200, description: 'Thông tin giao dịch' })
  @ApiResponse({ status: 404, description: 'Giao dịch không tìm thấy' })
  async getTransaction(@Param('id') id: string) {
    try {
      const transactionId = parseInt(id, 10);
      if (isNaN(transactionId)) {
        throw new BadRequestException('Invalid transaction ID');
      }

      const transaction =
        await this.transactionService.getTransaction(transactionId);

      return {
        status: 'success',
        data: transaction,
      };
    } catch (error) {
      this.logger.error(`Failed to get transaction: ${error.message}`);
      return {
        status: 'error',
        message: error.message,
      };
    }
  }

  /**
   * Get payment info from PayOS
   * GET /transactions/payment-info/:orderCode
   */
  @Get('payment-info/:orderCode')
  @ApiOperation({ summary: 'Lấy thông tin thanh toán từ PayOS' })
  @ApiResponse({ status: 200, description: 'Thông tin thanh toán' })
  @ApiResponse({ status: 400, description: 'Mã đơn hàng không hợp lệ' })
  async getPaymentInfo(@Param('orderCode') orderCode: string) {
    try {
      if (!orderCode || orderCode.trim() === '') {
        throw new BadRequestException('Invalid order code');
      }

      const info = await this.transactionService.getPaymentInfo(orderCode);

      return {
        status: 'success',
        data: info,
      };
    } catch (error) {
      this.logger.error(`Failed to get payment info: ${error.message}`);
      return {
        status: 'error',
        message: error.message,
      };
    }
  }

  /**
   * Update transaction
   * PUT /transactions/:id
   */
  @Put(':id')
  @ApiOperation({ summary: 'Cập nhật thông tin giao dịch' })
  @ApiBody({ type: UpdateTransactionDto })
  @ApiResponse({ status: 200, description: 'Cập nhật thành công' })
  @ApiResponse({ status: 400, description: 'ID giao dịch không hợp lệ' })
  @ApiResponse({ status: 404, description: 'Giao dịch không tìm thấy' })
  async updateTransaction(
    @Param('id') id: string,
    @Body() dto: UpdateTransactionDto,
  ) {
    try {
      const transactionId = parseInt(id, 10);
      if (isNaN(transactionId)) {
        throw new BadRequestException('Invalid transaction ID');
      }

      const transaction = await this.transactionService.updateTransaction(
        transactionId,
        dto,
      );

      return {
        status: 'success',
        data: transaction,
      };
    } catch (error) {
      this.logger.error(`Failed to update transaction: ${error.message}`);
      return {
        status: 'error',
        message: error.message,
      };
    }
  }

  /**
   * Cancel payment
   * POST /transactions/cancel/:orderCode
   */
  @Post('cancel/:orderCode')
  @ApiOperation({ summary: 'Hủy thanh toán' })
  @ApiResponse({ status: 200, description: 'Hủy thành công' })
  @ApiResponse({ status: 400, description: 'Mã đơn hàng không hợp lệ' })
  async cancelPayment(
    @Param('orderCode') orderCode: string,
    @Body('reason') reason?: string,
  ) {
    try {
      if (!orderCode || orderCode.trim() === '') {
        throw new BadRequestException('Invalid order code');
      }

      const result = await this.transactionService.cancelPayment(
        orderCode,
        reason,
      );

      return {
        status: 'success',
        data: result,
      };
    } catch (error) {
      this.logger.error(`Failed to cancel payment: ${error.message}`);
      return {
        status: 'error',
        message: error.message,
      };
    }
  }

  /**
   * Get all transactions (admin)
   * GET /transactions (without additional path)
   */
  @Get()
  @ApiOperation({ summary: 'Lấy danh sách tất cả giao dịch' })
  @ApiResponse({ status: 200, description: 'Danh sách giao dịch' })
  async getAllTransactions(
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    try {
      const limitNum = limit ? parseInt(limit, 10) : 10;
      const offsetNum = offset ? parseInt(offset, 10) : 0;

      const result = await this.transactionService.getAllTransactions(
        limitNum,
        offsetNum,
      );

      return {
        status: 'success',
        data: result,
      };
    } catch (error) {
      this.logger.error(`Failed to get all transactions: ${error.message}`);
      return {
        status: 'error',
        message: error.message,
      };
    }
  }
}
