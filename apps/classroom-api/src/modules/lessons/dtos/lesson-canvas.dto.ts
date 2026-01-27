import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

export enum LessonBlockType {
  TEXT = 'TEXT',
  IMAGE = 'IMAGE',
  SHAPE = 'SHAPE',
}

export class LessonBlockStyleDto {
  @ApiProperty({ required: false, example: '#000000' })
  @IsOptional()
  @IsString()
  color?: string;

  @ApiProperty({ required: false, example: '#ffffff' })
  @IsOptional()
  @IsString()
  backgroundColor?: string;

  @ApiProperty({ required: false, example: 16 })
  @IsOptional()
  @IsNumber()
  fontSize?: number;

  @ApiProperty({ required: false, example: 'bold' })
  @IsOptional()
  @IsString()
  fontWeight?: string;

  @ApiProperty({ required: false, example: 'Arial' })
  @IsOptional()
  @IsString()
  fontFamily?: string;
}

export class LessonBlockDto {
  @ApiProperty({ enum: LessonBlockType, example: LessonBlockType.TEXT })
  @IsEnum(LessonBlockType)
  type: LessonBlockType;

  @ApiProperty({ required: false, example: 'Hello world' })
  @IsOptional()
  @IsString()
  text?: string;

  @ApiProperty({
    required: false,
    example: 'https://example.com/image.png',
  })
  @IsOptional()
  @IsString()
  imageUrl?: string;

  @ApiProperty({ example: 100 })
  @IsNumber()
  x: number;

  @ApiProperty({ example: 200 })
  @IsNumber()
  y: number;

  @ApiProperty({ example: 300 })
  @IsNumber()
  width: number;

  @ApiProperty({ example: 150 })
  @IsNumber()
  height: number;

  @ApiProperty({ required: false, example: 0 })
  @IsOptional()
  @IsNumber()
  rotation?: number;

  @ApiProperty({ required: false, example: 1 })
  @IsOptional()
  @IsNumber()
  zIndex?: number;

  @ApiProperty({ required: false, type: LessonBlockStyleDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => LessonBlockStyleDto)
  style?: LessonBlockStyleDto;

  @ApiProperty({ required: false, description: 'Extra config per block' })
  @IsOptional()
  @IsObject()
  config?: Record<string, unknown>;
}

export class LessonCanvasDto {
  @ApiProperty({
    type: [LessonBlockDto],
    description: 'List of blocks on the lesson canvas',
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LessonBlockDto)
  blocks: LessonBlockDto[];

  @ApiProperty({
    required: false,
    example: { backgroundColor: '#ffffff' },
    description: 'Global canvas settings',
  })
  @IsOptional()
  @IsObject()
  settings?: Record<string, unknown>;
}
