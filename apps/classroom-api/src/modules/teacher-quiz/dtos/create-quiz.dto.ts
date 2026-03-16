import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateQuizDto {
  @IsString()
  @MaxLength(255)
  title!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsInt()
  classroomId!: number;

  @IsIn(['ASSIGNMENT', 'EXAM'])
  documentType!: 'ASSIGNMENT' | 'EXAM';

  @IsOptional()
  @IsInt()
  @Min(0)
  timeLimitMinutes?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  totalPoints?: number;
}
