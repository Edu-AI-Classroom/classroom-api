import { IsEnum, IsOptional, IsString } from 'class-validator';
import { PaymentStatus } from '../types';

export class UpdateTransactionDto {
  @IsString()
  @IsOptional()
  note?: string;

  @IsEnum(PaymentStatus)
  @IsOptional()
  status?: PaymentStatus;

  @IsString()
  @IsOptional()
  order_code?: string;
}
