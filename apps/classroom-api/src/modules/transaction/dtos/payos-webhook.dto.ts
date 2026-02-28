import { Type } from 'class-transformer';
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  Matches,
  Min,
  ValidateNested,
} from 'class-validator';
import { PayOSPaymentStatus } from '../types/payos.type';

export class PayOSWebhookDataDto {
  @IsNotEmpty({ message: 'orderCode is required' })
  @IsNumber({}, { message: 'orderCode must be a number' })
  @Min(1, { message: 'orderCode must be greater than 0' })
  orderCode: number;

  @IsNotEmpty({ message: 'amount is required' })
  @IsNumber({}, { message: 'amount must be a number' })
  @Min(1, { message: 'amount must be greater than 0' })
  amount: number;

  @IsNotEmpty({ message: 'description is required' })
  @IsString({ message: 'description must be a string' })
  description: string;

  @IsNotEmpty({ message: 'accountNumber is required' })
  @IsString({ message: 'accountNumber must be a string' })
  accountNumber: string;

  @IsNotEmpty({ message: 'reference is required' })
  @IsString({ message: 'reference must be a string' })
  reference: string;

  @IsNotEmpty({ message: 'transactionDateTime is required' })
  @IsString({ message: 'transactionDateTime must be a string' })
  @Matches(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/, {
    message: 'transactionDateTime must be in ISO 8601 format',
  })
  transactionDateTime: string;

  @IsNotEmpty({ message: 'currency is required' })
  @IsString({ message: 'currency must be a string' })
  @Matches(/^[A-Z]{3}$/, { message: 'currency must be a 3-letter ISO code' })
  currency: string;

  @IsOptional()
  @IsNumber({}, { message: 'paymentMethodId must be a number' })
  paymentMethodId?: number;

  @IsOptional()
  @IsString({ message: 'paymentMethodName must be a string' })
  paymentMethodName?: string;

  @IsNotEmpty({ message: 'counterPartyCode is required' })
  @IsString({ message: 'counterPartyCode must be a string' })
  counterPartyCode: string;

  @IsNotEmpty({ message: 'counterPartyName is required' })
  @IsString({ message: 'counterPartyName must be a string' })
  counterPartyName: string;

  @IsNotEmpty({ message: 'paymentLinkId is required' })
  @IsString({ message: 'paymentLinkId must be a string' })
  paymentLinkId: string;

  @IsNotEmpty({ message: 'code is required' })
  @IsString({ message: 'code must be a string' })
  code: string;

  @IsNotEmpty({ message: 'status is required' })
  @IsEnum(PayOSPaymentStatus, {
    message: `status must be one of: ${Object.values(PayOSPaymentStatus).join(', ')}`,
  })
  status: PayOSPaymentStatus;

  @IsNotEmpty({ message: 'bookingId is required' })
  @IsString({ message: 'bookingId must be a string' })
  bookingId: string;

  @IsNotEmpty({ message: 'createdAt is required' })
  @IsString({ message: 'createdAt must be a string' })
  @Matches(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/, {
    message: 'createdAt must be in ISO 8601 format',
  })
  createdAt: string;

  @IsOptional()
  @IsString({ message: 'cancelledAt must be a string' })
  @Matches(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/, {
    message: 'cancelledAt must be in ISO 8601 format if provided',
  })
  cancelledAt?: string;

  @IsOptional()
  @IsString({ message: 'expiredAt must be a string' })
  @Matches(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/, {
    message: 'expiredAt must be in ISO 8601 format if provided',
  })
  expiredAt?: string;
}

export class PayOSWebhookDto {
  @IsNotEmpty({ message: 'data is required' })
  @IsObject({ message: 'data must be an object' })
  @ValidateNested()
  @Type(() => PayOSWebhookDataDto)
  data: PayOSWebhookDataDto;

  @IsNotEmpty({ message: 'signature is required' })
  @IsString({ message: 'signature must be a string' })
  @Matches(/^[a-f0-9]{64}$/, {
    message: 'signature must be a valid SHA256 hash',
  })
  signature: string;
}
