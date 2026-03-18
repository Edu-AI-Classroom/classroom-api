import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class GenerateQuizWithAiDto {
  @ApiProperty({
    example: 'Tạo quiz 10 câu về chủ đề Phân số lớp 5, gồm trắc nghiệm và tự luận.',
  })
  @IsString()
  prompt!: string;

  @ApiProperty({ example: 10, default: 10, required: false })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(50)
  totalQuestions?: number = 10;

  @ApiProperty({ example: 7, required: false })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(50)
  mcqCount?: number;

  @ApiProperty({ example: 3, required: false })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(50)
  essayCount?: number;

  @ApiProperty({ example: 1, default: 1, required: false })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(10)
  pointsPerQuestion?: number = 1;

  @ApiProperty({ example: 'vi', default: 'vi', required: false })
  @IsOptional()
  @IsString()
  language?: string = 'vi';
}

