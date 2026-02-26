import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { PaymentGateway, TransactionType } from '../types';

export class CreateTransactionDto {
  @IsNumber()
  @IsNotEmpty()
  @Min(0.01)
  amount: number;

  @IsEnum(TransactionType)
  @IsNotEmpty()
  transaction_type: string;

  @IsEnum(PaymentGateway)
  @IsNotEmpty()
  payment_gateway: string;

  @IsNumber()
  @IsNotEmpty()
  sub_id: number;

  @IsString()
  @IsOptional()
  note?: string;

  @IsString()
  @IsOptional()
  order_code?: string;

  @IsString()
  @IsOptional()
  @MaxLength(25, { message: 'Description must not exceed 25 characters' })
  description?: string;

  @IsString()
  @IsOptional()
  return_url?: string;

  @IsString()
  @IsOptional()
  cancel_url?: string;
}
