import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Roles } from '../auth/decorators/public.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { AdminService } from './admin.service';
import { RecentTransactionDto } from './dtos';

@ApiTags('Admin - Transactions')
@Controller('admin/transactions')
@ApiBearerAuth('JWT-auth')
@Roles('ADMIN')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AdminTransactionController {
  constructor(private readonly adminService: AdminService) {}

  /**
   * Lấy danh sách tất cả giao dịch
   */
  @Get()
  @ApiOperation({ summary: 'Lấy danh sách tất cả giao dịch' })
  @ApiResponse({ status: 200, description: 'Danh sách giao dịch' })
  @ApiResponse({ status: 401, description: 'Chưa xác thực' })
  @ApiResponse({ status: 403, description: 'Không đủ quyền' })
  async getAllTransactions(
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ): Promise<RecentTransactionDto[]> {
    const limitNum = limit ? parseInt(limit, 10) : 10;
    const offsetNum = offset ? parseInt(offset, 10) : 0;
    return this.adminService.getAllTransactions(limitNum, offsetNum);
  }

  /**
   * Lấy chi tiết giao dịch
   */
  @Get(':id')
  @ApiOperation({ summary: 'Lấy chi tiết giao dịch' })
  @ApiResponse({ status: 200, description: 'Chi tiết giao dịch' })
  @ApiResponse({ status: 404, description: 'Giao dịch không tìm thấy' })
  async getTransactionDetail(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<any> {
    return this.adminService.getTransactionDetail(id);
  }

  /**
   * Hủy giao dịch
   */
  @Put(':id/cancel')
  @ApiOperation({ summary: 'Hủy giao dịch' })
  @ApiResponse({ status: 200, description: 'Hủy thành công' })
  @ApiResponse({ status: 404, description: 'Giao dịch không tìm thấy' })
  async cancelTransaction(
    @Param('id', ParseIntPipe) id: number,
    @Body('reason') reason?: string,
  ): Promise<any> {
    return this.adminService.cancelTransaction(id, reason);
  }
}
