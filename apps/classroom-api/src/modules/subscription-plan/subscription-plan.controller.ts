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
  Req,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Public, Roles } from '../auth/decorators/public.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CreateSubscriptionPlanDto } from './dtos/create-subscription-plan.dto';
import { UpdateSubscriptionPlanDto } from './dtos/update-subscription-plan.dto';
import { SubscriptionPlanService } from './subscription-plan.service';

@ApiTags('Subscription Plans')
@Controller('subscription-plans')
export class SubscriptionPlanController {
  constructor(
    private readonly subscriptionPlanService: SubscriptionPlanService,
  ) {}

  @Post()
  @ApiBearerAuth('JWT-auth')
  @Roles('ADMIN')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ summary: 'Tạo gói subscription mới' })
  @ApiBody({ type: CreateSubscriptionPlanDto })
  @ApiResponse({ status: 201, description: 'Tạo thành công' })
  @ApiResponse({ status: 409, description: 'Mã plan đã tồn tại' })
  create(@Body() dto: CreateSubscriptionPlanDto) {
    return this.subscriptionPlanService.create(dto);
  }

  @Get()
  @Public()
  @ApiOperation({ summary: 'Danh sách gói subscription' })
  @ApiQuery({
    name: 'activeOnly',
    required: false,
    type: Boolean,
    description: 'Chỉ lấy gói đang hoạt động',
  })
  @ApiResponse({ status: 200, description: 'Danh sách gói' })
  findAll(@Query('activeOnly') activeOnly?: string) {
    // Chuyển đổi query string sang boolean
    const onlyActive = activeOnly === 'true' || activeOnly === '1';
    return this.subscriptionPlanService.findAll(onlyActive);
  }

  // Đổi parameter từ :code thành :sub_code cho đồng bộ với DB
  @Get('by-code/:sub_code')
  @Public()
  @ApiOperation({ summary: 'Lấy gói theo mã định danh (sub_code)' })
  @ApiResponse({ status: 200, description: 'Chi tiết gói' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy' })
  findByCode(@Param('sub_code') sub_code: string) {
    return this.subscriptionPlanService.findByCode(sub_code);
  }

  @Get('user/my-subscription')
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Lấy thông tin subscription hiện tại của user',
    description:
      'Trả về trạng thái subscription, ngày hết hạn, số ngày còn lại, v.v.',
  })
  @ApiResponse({ status: 200, description: 'Thông tin subscription' })
  @ApiResponse({ status: 401, description: 'Chưa đăng nhập' })
  async getMySubscription(@Req() request: any) {
    const userId =
      request.user?.userId || request.user?.user_id || request.user?.id;

    if (!userId) {
      throw new BadRequestException('User ID not found');
    }

    return this.subscriptionPlanService.getUserSubscription(userId);
  }

  @Get(':id')
  @Public()
  @ApiOperation({ summary: 'Chi tiết gói theo ID' })
  @ApiResponse({ status: 200, description: 'Chi tiết gói' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.subscriptionPlanService.findOne(id);
  }

  @Put(':id')
  @ApiBearerAuth('JWT-auth')
  @Roles('ADMIN')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ summary: 'Cập nhật gói subscription' })
  @ApiBody({ type: UpdateSubscriptionPlanDto })
  @ApiResponse({ status: 200, description: 'Cập nhật thành công' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateSubscriptionPlanDto,
  ) {
    return this.subscriptionPlanService.update(id, dto);
  }

  @Delete(':id')
  @ApiBearerAuth('JWT-auth')
  @Roles('ADMIN')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ summary: 'Xóa gói subscription' })
  @ApiResponse({ status: 200, description: 'Xóa thành công' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.subscriptionPlanService.remove(id);
  }
}
