import { ApiProperty } from '@nestjs/swagger';

export class CurrentSubscriptionDto {
  @ApiProperty({ description: 'Current subscription state' })
  status: 'NOT_SUBSCRIBED' | 'ACTIVE' | 'EXPIRED';

  @ApiProperty({ description: 'Subscription name', required: false })
  subscriptionName?: string;

  @ApiProperty({ description: 'Subscription code', required: false })
  subscriptionCode?: string;

  @ApiProperty({ description: 'Subscription start date', required: false })
  startDate?: Date;

  @ApiProperty({ description: 'Subscription expiry date', required: false })
  expiryDate?: Date;

  @ApiProperty({ description: 'Remaining subscription days', required: false })
  daysRemaining?: number;

  @ApiProperty({ description: 'Subscription status label', required: false })
  subscriptionStatus?: string;

  @ApiProperty({
    description: 'AI token allowance from the plan',
    required: false,
  })
  aiTokenLimit?: number | null;

  @ApiProperty({
    description: 'Current AI token balance on the account',
    required: false,
  })
  aiTokensRemaining?: number;

  @ApiProperty({
    description: 'Maximum classes allowed by the plan',
    required: false,
  })
  maxClasses?: number | null;

  @ApiProperty({
    description: 'Number of owned classes already created',
    required: false,
  })
  usedClasses?: number;

  @ApiProperty({
    description: 'Remaining classes that can still be created',
    required: false,
  })
  remainingClasses?: number | null;
}
