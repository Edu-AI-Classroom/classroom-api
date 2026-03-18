import { PartialType } from '@nestjs/swagger';
import { CreateAssignmentDto } from './create-assignment.dto';
import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class UpdateAssignmentDto extends PartialType(CreateAssignmentDto) {}

export class SubmitAnswerDto {
  @ApiProperty({ example: 1, description: 'Question block ID' })
  genBlockId: number;

  @ApiProperty({ example: 'B', description: 'Student answer' })
  @IsString()
  studentAnswer: string;
}

export class SubmitAssignmentDto {
  @ApiProperty({
    type: [SubmitAnswerDto],
    description: 'Array of question answers',
  })
  answers: SubmitAnswerDto[];
}

export class GradeSubmissionDto {
  @ApiProperty({ example: 85, description: 'Score' })
  score: number;

  @ApiProperty({
    example: 'Good work, but check question 3',
    required: false,
    description: 'Feedback for student',
  })
  @IsOptional()
  @IsString()
  feedback?: string;
}
