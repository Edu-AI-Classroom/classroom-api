import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Roles } from '../auth/decorators/public.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CreateSubscriptionPlanDto } from '../subscription-plan/dtos/create-subscription-plan.dto';
import { UpdateSubscriptionPlanDto } from '../subscription-plan/dtos/update-subscription-plan.dto';
import { SubscriptionPlanService } from '../subscription-plan/subscription-plan.service';

@ApiTags('Admin - Subscription Plans')
@Controller('admin/subscription-plans')
@ApiBearerAuth('JWT-auth')
@Roles('ADMIN')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AdminSubscriptionPlanController {
  constructor(
    private readonly subscriptionPlanService: SubscriptionPlanService,
  ) {}

  /**
   * Tạo gói subscription mới (admin)
   */
  @Post()
  @ApiOperation({ summary: 'Tạo gói subscription mới' })
  @ApiBody({ type: CreateSubscriptionPlanDto })
  @ApiResponse({ status: 201, description: 'Tạo thành công' })
  @ApiResponse({ status: 401, description: 'Chưa xác thực' })
  @ApiResponse({ status: 403, description: 'Không đủ quyền' })
  create(@Body() dto: CreateSubscriptionPlanDto) {
    return this.subscriptionPlanService.create(dto);
  }

  /**
   * Danh sách gói subscription
   */
  @Get()
  @ApiOperation({ summary: 'Danh sách gói subscription' })
  @ApiQuery({
    name: 'activeOnly',
    required: false,
    type: Boolean,
    description: 'Chỉ lấy gói đang hoạt động',
  })
  @ApiResponse({ status: 200, description: 'Danh sách gói' })
  findAll(@Query('activeOnly') activeOnly?: string) {
    const onlyActive = activeOnly === 'true' || activeOnly === '1';
    return this.subscriptionPlanService.findAll(onlyActive);
  }

  /**
   * Chi tiết gói subscription
   */
  @Get(':id')
  @ApiOperation({ summary: 'Chi tiết gói theo ID' })
  @ApiResponse({ status: 200, description: 'Chi tiết gói' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.subscriptionPlanService.findOne(id);
  }

  /**
   * Cập nhật gói subscription
   */
  @Put(':id')
  @ApiOperation({ summary: 'Cập nhật gói subscription' })
  @ApiBody({ type: UpdateSubscriptionPlanDto })
  @ApiResponse({ status: 200, description: 'Cập nhật thành công' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateSubscriptionPlanDto,
  ) {
    return this.subscriptionPlanService.update(id, dto);
  }

  /**
   * Xóa gói subscription
   */
  @Delete(':id')
  @ApiOperation({ summary: 'Xóa gói subscription' })
  @ApiResponse({ status: 200, description: 'Xóa thành công' })
  @ApiResponse({ status: 404, description: 'Gói không tìm thấy' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.subscriptionPlanService.remove(id);
  }
}
