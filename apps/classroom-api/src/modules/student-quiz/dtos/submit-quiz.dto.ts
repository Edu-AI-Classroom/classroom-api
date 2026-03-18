import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsNotEmpty,
  IsObject,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class SubmitQuizAnswerDto {
  @ApiProperty({ example: 'b6a2c4c9-4e1c-4f4a-8d0b-2e9a6b1c2d3e' })
  @IsString()
  @IsNotEmpty()
  blockId!: string;

  @ApiProperty({
    description: 'Answer payload. MCQ: {"index": 2}. ESSAY: {"text": "..."}',
    example: { index: 1 },
  })
  @IsObject()
  answer!: any;
}

export class SubmitQuizDto {
  @ApiProperty({ type: [SubmitQuizAnswerDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SubmitQuizAnswerDto)
  answers!: SubmitQuizAnswerDto[];
}
