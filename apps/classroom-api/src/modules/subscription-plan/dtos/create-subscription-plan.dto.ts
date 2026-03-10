import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateSubscriptionPlanDto {
  @ApiProperty({ example: 'BASIC_MONTHLY', description: 'Mã plan (unique)' })
  @IsString()
  @MaxLength(50)
  sub_code: string;

  @ApiProperty({ example: 'Gói Cơ bản - Tháng' })
  @IsString()
  @MaxLength(255)
  sub_name: string;

  @ApiProperty({ example: 199000.0, description: 'Giá (VND)' })
  @IsNumber()
  @Min(0)
  @IsOptional()
  price?: number;

  @ApiProperty({ example: 30, description: 'Số ngày sử dụng' })
  @IsOptional()
  @IsInt()
  @Min(1)
  duration_days?: number;

  @ApiProperty({ example: 10000, description: 'Giới hạn AI token/tháng' })
  @IsOptional()
  @IsInt()
  @Min(0)
  ai_token_limit?: number;

  @ApiProperty({
    required: false,
    example: 500,
    description: 'Giới hạn request AI/tháng',
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  ai_request_limit?: number;

  @ApiProperty({ required: false, example: 5, description: 'Số lớp tối đa' })
  @IsOptional()
  @IsInt()
  @Min(0)
  max_classes?: number;

  @ApiProperty({
    required: false,
    example: 100,
    description: 'Số tài liệu tối đa',
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  max_documents?: number;

  @ApiProperty({ required: false, example: true, default: true })
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}
