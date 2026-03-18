import { ApiProperty } from '@nestjs/swagger';
import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  IsEnum,
} from 'class-validator';

export class CreateLessonDto {
  @ApiProperty({ example: 'Introduction to Fractions' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  title: string;

  @ApiProperty({ example: '<p>HTML content here...</p>' })
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiProperty({ example: 1, description: 'Class ID this lesson belongs to' })
  @IsInt()
  @IsNotEmpty()
  classId: number;

  @ApiProperty({ example: 'DRAFT', required: false })
  @IsOptional()
  @IsString()
  status?: 'DRAFT' | 'PUBLISHED';

  @ApiProperty({
    type: 'string',
    format: 'binary',
    required: false,
    description: 'PDF File document (Optional)',
  })
  @IsOptional()
  file?: any;
}
