import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class IngestDocumentDto {
  @ApiProperty({ example: 'Bai doc hieu chu de phan so' })
  @IsString()
  title!: string;

  @ApiProperty({ enum: ['LESSON', 'ASSIGNMENT', 'EXAM'], default: 'LESSON' })
  @IsOptional()
  @IsIn(['LESSON', 'ASSIGNMENT', 'EXAM'])
  documentType?: 'LESSON' | 'ASSIGNMENT' | 'EXAM' = 'LESSON';

  @ApiProperty({ example: 5 })
  @IsInt()
  @Min(1)
  @Max(12)
  gradeLevel!: number;

  @ApiProperty({ example: 1 })
  @IsInt()
  subjectId!: number;

  @ApiProperty({ required: false, example: 10 })
  @IsOptional()
  @IsInt()
  classId?: number;

  @ApiProperty({ required: false, example: ['chuong 1', 'phan so'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiProperty({ required: false, example: 'Vi du ghi chu them' })
  @IsOptional()
  @IsString()
  note?: string;
}
