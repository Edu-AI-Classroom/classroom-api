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
} from '@nestjs/common';
import {
  ApiBody,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
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
  @ApiOperation({ summary: 'Tạo gói subscription mới' })
  @ApiBody({ type: CreateSubscriptionPlanDto })
  @ApiResponse({ status: 201, description: 'Tạo thành công' })
  @ApiResponse({ status: 409, description: 'Mã plan đã tồn tại' })
  create(@Body() dto: CreateSubscriptionPlanDto) {
    return this.subscriptionPlanService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Danh sách gói subscription' })
  @ApiQuery({
    name: 'activeOnly',
    required: false,
    type: Boolean,
    description: 'Chỉ lấy gói đang active',
  })
  @ApiResponse({ status: 200, description: 'Danh sách gói' })
  findAll(@Query('activeOnly') activeOnly?: string) {
    const onlyActive = activeOnly === 'true' || activeOnly === '1';
    return this.subscriptionPlanService.findAll(onlyActive);
  }

  @Get('by-code/:code')
  @ApiOperation({ summary: 'Lấy gói theo mã (code)' })
  @ApiResponse({ status: 200, description: 'Chi tiết gói' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy' })
  findByCode(@Param('code') code: string) {
    return this.subscriptionPlanService.findByCode(code);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Chi tiết gói theo ID' })
  @ApiResponse({ status: 200, description: 'Chi tiết gói' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.subscriptionPlanService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Cập nhật gói subscription' })
  @ApiBody({ type: UpdateSubscriptionPlanDto })
  @ApiResponse({ status: 200, description: 'Cập nhật thành công' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateSubscriptionPlanDto,
  ) {
    return this.subscriptionPlanService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Xóa gói subscription' })
  @ApiResponse({ status: 200, description: 'Xóa thành công' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.subscriptionPlanService.remove(id);
  }
}
