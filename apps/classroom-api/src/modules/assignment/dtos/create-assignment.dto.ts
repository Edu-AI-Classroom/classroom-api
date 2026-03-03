import { ApiProperty } from '@nestjs/swagger';
import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateAssignmentDto {
  @ApiProperty({ example: 'Math Assignment 1' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  title: string;

  @ApiProperty({ required: true, example: 1, description: 'classroom_id' })
  @IsInt()
  @IsNotEmpty()
  classId: number;

  @ApiProperty({ required: false, example: 'Complete the exercises' })
  @IsOptional()
  @IsString()
  note?: string;

  @ApiProperty({ required: false, example: 5 })
  @IsOptional()
  @IsInt()
  gradeLevel?: number;

  @ApiProperty({ required: false, example: 1, description: 'subject_id in DB' })
  @IsOptional()
  @IsInt()
  subjectId?: number;
}
