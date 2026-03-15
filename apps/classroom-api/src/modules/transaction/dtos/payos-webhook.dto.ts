import { Type } from 'class-transformer';
import {
  IsEnum,
  IsISO8601,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { PayOSPaymentStatus } from '../types/payos.type';

export class PayOSWebhookDataDto {
  @IsOptional()
  @IsNumber()
  @Min(1)
  orderCode?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  amount?: number;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  accountNumber?: string;

  @IsOptional()
  @IsString()
  reference?: string;

  @IsOptional()
  @IsISO8601()
  transactionDateTime?: string;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
  @IsNumber()
  paymentMethodId?: number;

  @IsOptional()
  @IsString()
  paymentMethodName?: string;

  @IsOptional()
  @IsString()
  counterPartyCode?: string;

  @IsOptional()
  @IsString()
  counterPartyName?: string;

  @IsOptional()
  @IsString()
  paymentLinkId?: string;

  @IsOptional()
  @IsString()
  code?: string;

  @IsOptional()
  @IsEnum(PayOSPaymentStatus)
  status?: PayOSPaymentStatus;

  @IsOptional()
  @IsString()
  bookingId?: string;

  @IsOptional()
  @IsISO8601()
  createdAt?: string;

  @IsOptional()
  @IsISO8601()
  cancelledAt?: string;

  @IsOptional()
  @IsISO8601()
  expiredAt?: string;
}

export class PayOSWebhookDto {
  @IsObject()
  @ValidateNested()
  @Type(() => PayOSWebhookDataDto)
  data: PayOSWebhookDataDto;

  @IsString()
  signature: string;
}
