import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class ConsumeParentLinkCodeDto {
  @ApiProperty({ example: 'AB12CD34' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(32)
  code: string;

  @ApiPropertyOptional({ example: 'Mother' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  relationship?: string;
}

export class CreateParentConversationDto {
  @ApiProperty({ example: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  classId: number;

  @ApiProperty({ example: 2 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  studentId: number;
}
