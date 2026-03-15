import { ApiProperty } from '@nestjs/swagger';
import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  IsEnum,
  IsDateString,
  IsArray,
  ValidateNested,
  IsBoolean,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum AssignmentType {
  QUIZ = 'QUIZ',
  ASSIGNMENT = 'ASSIGNMENT',
  HOMEWORK = 'HOMEWORK',
}

export class CreateQuestionDto {
  @ApiProperty({ example: 'What is 2 + 2?' })
  @IsString()
  @IsNotEmpty()
  questionText: string;

  @ApiProperty({ enum: ['MULTIPLE_CHOICE', 'SHORT_ANSWER', 'ESSAY'] })
  @IsString()
  @IsNotEmpty()
  questionType: string;

  @ApiProperty({
    example: ['2', '4', '6', '8'],
    required: false,
    description: 'For multiple choice questions',
  })
  @IsOptional()
  @IsArray()
  options?: string[];

  @ApiProperty({ example: '4', description: 'Correct answer' })
  @IsString()
  @IsNotEmpty()
  correctAnswer: string;

  @ApiProperty({ example: 10, description: 'Points for this question' })
  @IsInt()
  @Min(1)
  @Max(1000)
  points: number;

  @ApiProperty({ example: 'Remember basic math', required: false })
  @IsOptional()
  @IsString()
  explanation?: string;
}

export class CreateAssignmentDto {
  @ApiProperty({ example: 'Math Quiz Chapter 1' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  title: string;

  @ApiProperty({ required: true, example: 1, description: 'classroom_id' })
  @IsInt()
  @IsNotEmpty()
  classId: number;

  @ApiProperty({
    enum: AssignmentType,
    example: 'QUIZ',
    description: 'Type of assignment',
  })
  @IsEnum(AssignmentType)
  assignmentType: AssignmentType;

  @ApiProperty({
    example: '2026-03-15T10:00:00Z',
    description: 'Start date when students can begin',
  })
  @IsDateString()
  @IsNotEmpty()
  startDate: string;

  @ApiProperty({
    example: '2026-03-20T23:59:59Z',
    description: 'Due date deadline for submission',
  })
  @IsDateString()
  @IsNotEmpty()
  dueDate: string;

  @ApiProperty({
    required: false,
    example: 100,
    description: 'Total points for assignment',
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  totalPoints?: number;

  @ApiProperty({ required: false, example: 'Complete the exercises' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ required: false, example: 5 })
  @IsOptional()
  @IsInt()
  gradeLevel?: number;

  @ApiProperty({ required: false, example: 1, description: 'subject_id in DB' })
  @IsOptional()
  @IsInt()
  subjectId?: number;

  @ApiProperty({
    required: false,
    example: true,
    description: 'Show answers after submission',
  })
  @IsOptional()
  @IsBoolean()
  showAnswersAfterSubmit?: boolean;

  @ApiProperty({
    required: false,
    type: [CreateQuestionDto],
    description: 'Quiz questions (for QUIZ type)',
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateQuestionDto)
  questions?: CreateQuestionDto[];
}
