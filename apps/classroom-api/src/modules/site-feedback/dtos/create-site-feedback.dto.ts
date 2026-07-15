import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsEmail,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateSiteFeedbackDto {
  @ApiProperty({ example: 'Minh Ngoc' })
  @IsString()
  @MaxLength(120)
  name: string;

  @ApiProperty({ required: false, example: 'minhngoc@gmail.com' })
  @IsOptional()
  @IsEmail()
  @MaxLength(255)
  email?: string;

  @ApiProperty({ required: false, example: 'TEACHER' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  role?: string;

  @ApiProperty({ example: 5, minimum: 1, maximum: 5 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(5)
  rating: number;

  @ApiProperty({ example: 'Teachify helps me prepare class materials faster.' })
  @IsString()
  @MaxLength(1000)
  comment: string;
}
