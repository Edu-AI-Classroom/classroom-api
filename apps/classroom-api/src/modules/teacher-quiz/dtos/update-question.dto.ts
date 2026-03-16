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

export class UpdateQuestionDto {
  @IsIn(['MCQ', 'ESSAY'])
  type!: 'MCQ' | 'ESSAY';

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  questionText?: string;

  @ValidateIf((v) => v.type === 'MCQ')
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  options?: string[];

  @ValidateIf((v) => v.type === 'MCQ')
  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  correctIndex?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  maxScore?: number;
}
