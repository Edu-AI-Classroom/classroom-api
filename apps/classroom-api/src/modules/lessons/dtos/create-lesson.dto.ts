import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDefined,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { LessonCanvasDto } from './lesson-canvas.dto';

export class CreateLessonDto {
  @ApiProperty({ example: 'Introduction to Fractions' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  title: string;

  @ApiProperty({ required: false, example: 'Draft note for this lesson' })
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

  @ApiProperty({
    example: 1,
    description: 'owner_id (teacher user_id) who owns this lesson document',
  })
  @IsOptional()
  @IsInt()
  ownerId?: number;

  @ApiProperty({
    type: LessonCanvasDto,
    description: 'Canvas configuration for this lesson',
  })
  @IsDefined()
  @ValidateNested()
  @Type(() => LessonCanvasDto)
  canvas: LessonCanvasDto;
}
