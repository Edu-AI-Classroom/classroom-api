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

  @IsOptional()
  @Type(() => Number)
  positionOrder?: number;
}
