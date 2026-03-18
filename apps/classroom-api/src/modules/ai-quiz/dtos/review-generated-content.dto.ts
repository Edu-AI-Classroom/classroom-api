import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsIn,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';

export class ReviewGeneratedContentDto {
  @ApiProperty({ example: '6b37adf2-a0fd-4c9a-a4d7-4f5cd74f96b7' })
  @IsUUID()
  documentId!: string;

  @ApiProperty({ example: 'f7fd3196-b4ce-4f7a-bf6b-ec00f4ee60a1' })
  @IsUUID()
  sourceChunkId!: string;

  @ApiProperty({ enum: ['APPROVED', 'EDITED', 'REJECTED'] })
  @IsIn(['APPROVED', 'EDITED', 'REJECTED'])
  decision!: 'APPROVED' | 'EDITED' | 'REJECTED';

  @ApiProperty({ enum: ['QUIZ_MCQ', 'QUIZ_SHORT', 'READING'] })
  @IsIn(['QUIZ_MCQ', 'QUIZ_SHORT', 'READING'])
  contentType!: 'QUIZ_MCQ' | 'QUIZ_SHORT' | 'READING';

  @ApiProperty({
    type: Object,
    example: {
      question: '1/2 + 1/4 = ?',
      options: ['1/2', '3/4', '1', '2'],
      correct_index: 1,
    },
  })
  @IsObject()
  payload!: Record<string, unknown>;

  @ApiProperty({ required: false, example: ['phan so', 'toan lop 5'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiProperty({
    required: false,
    example: 'MEDIUM',
    enum: ['EASY', 'MEDIUM', 'HARD'],
  })
  @IsOptional()
  @IsIn(['EASY', 'MEDIUM', 'HARD'])
  difficulty?: 'EASY' | 'MEDIUM' | 'HARD';

  @ApiProperty({ required: false, example: 'UNDERSTAND' })
  @IsOptional()
  @IsString()
  cognitiveLevel?: string;

  @ApiProperty({ required: false, example: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  chapterId?: number;

  @ApiProperty({ required: false, example: 3 })
  @IsOptional()
  @IsInt()
  @Min(1)
  sectionId?: number;

  @ApiProperty({
    required: false,
    example: 'f4a8c46d-6f5d-4ece-89a9-18f66631f8c4',
  })
  @IsOptional()
  @IsUUID()
  requestId?: string;

  @ApiProperty({
    required: false,
    example: 'Can chinh sua nhe de phu hop lop hoc',
  })
  @IsOptional()
  @IsString()
  reviewNote?: string;
}
