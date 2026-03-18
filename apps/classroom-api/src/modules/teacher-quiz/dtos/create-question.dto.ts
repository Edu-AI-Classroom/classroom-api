import { Type } from 'class-transformer';
import {
  IsArray,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateIf,
} from 'class-validator';

export class CreateQuestionDto {
  @IsString()
  quizId!: string;

  @IsIn(['MCQ', 'ESSAY'])
  type!: 'MCQ' | 'ESSAY';

  @IsString()
  @MaxLength(5000)
  questionText!: string;

  @ValidateIf((v) => v.type === 'MCQ')
  @IsArray()
  @IsString({ each: true })
  options?: string[];

  @ValidateIf((v) => v.type === 'MCQ')
  @IsInt()
  @Min(0)
  @Type(() => Number)
  correctIndex?: number;

  @IsInt()
  @Min(0)
  @Type(() => Number)
  maxScore!: number;

  // Optional: expected answer / rubric for ESSAY (for teacher grading / AI assist)
  @ValidateIf((v) => v.type === 'ESSAY')
  @IsOptional()
  @IsString()
  @MaxLength(10000)
  expectedAnswer?: string;

  @IsOptional()
  @Type(() => Number)
  positionOrder?: number;
}
