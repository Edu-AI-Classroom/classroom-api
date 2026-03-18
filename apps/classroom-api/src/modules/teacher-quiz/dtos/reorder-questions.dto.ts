import { IsArray, IsString } from 'class-validator';

export class ReorderQuestionsDto {
  @IsString()
  quizId!: string;

  @IsArray()
  @IsString({ each: true })
  orderedQuestionIds!: string[];
}
