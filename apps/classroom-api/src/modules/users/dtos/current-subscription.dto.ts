import { ApiProperty } from '@nestjs/swagger';

export class CurrentSubscriptionDto {
  @ApiProperty({ description: 'Trạng thái đăng ký' })
  status: 'NOT_SUBSCRIBED' | 'ACTIVE' | 'EXPIRED';

  @ApiProperty({ description: 'Tên gói subscription', required: false })
  subscriptionName?: string;

  @ApiProperty({ description: 'Mã gói subscription', required: false })
  subscriptionCode?: string;

  @ApiProperty({ description: 'Ngày bắt đầu đăng ký', required: false })
  startDate?: Date;

  @ApiProperty({ description: 'Ngày hết hạn', required: false })
  expiryDate?: Date;

  @ApiProperty({ description: 'Số ngày còn lại', required: false })
  daysRemaining?: number;

  @ApiProperty({ description: 'Trạng thái subscription', required: false })
  subscriptionStatus?: string;
}
