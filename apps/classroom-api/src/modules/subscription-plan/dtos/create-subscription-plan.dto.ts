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
  code: string;

  @ApiProperty({ example: 'Gói Cơ bản - Tháng' })
  @IsString()
  @MaxLength(100)
  name: string;

  @ApiProperty({ example: 199000, description: 'Giá (VND)' })
  @IsNumber()
  @Min(0)
  price: number;

  @ApiProperty({ example: 30, description: 'Số ngày sử dụng' })
  @IsInt()
  @Min(1)
  duration_days: number;

  @ApiProperty({ example: 10000, description: 'Giới hạn AI token/tháng' })
  @IsInt()
  @Min(0)
  ai_token_limit: number;

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
    example: 20,
    description: 'Số bài kiểm tra/tháng',
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  max_exams_per_month?: number;

  @ApiProperty({
    required: false,
    example: 50,
    description: 'Số bài giảng AI tối đa',
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  max_lessons_ai?: number;

  @ApiProperty({ required: false, example: true })
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}
