import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsEnum,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateNewsDto {
  @ApiProperty({
    example: 1,
    description: 'ID of the classroom to post news in',
  })
  @IsInt()
  @Type(() => Number)
  @IsNotEmpty()
  class_id: number;

  @ApiProperty({ example: 'Midterm Exam Schedule' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiPropertyOptional({ example: 'The exam will take place on Monday...' })
  @IsString()
  @IsOptional()
  content?: string;

  @ApiPropertyOptional({ example: 'PUBLISHED', enum: ['DRAFT', 'PUBLISHED'] })
  @IsString()
  @IsOptional()
  status?: string = 'PUBLISHED';
}
