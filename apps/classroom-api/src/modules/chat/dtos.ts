import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class MessageAttachmentInputDto {
  @ApiProperty()
  @IsString()
  fileUrl: string;

  @ApiProperty()
  @IsString()
  @MaxLength(255)
  fileName: string;

  @ApiProperty()
  @IsString()
  @MaxLength(100)
  mimeType: string;

  @ApiProperty()
  @IsInt()
  fileSize: number;
}

export class CreateMessageDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  body?: string;

  @ApiPropertyOptional({ type: [MessageAttachmentInputDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MessageAttachmentInputDto)
  attachments?: MessageAttachmentInputDto[];
}

export class CreateStudentConversationDto {
  @ApiProperty({ example: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  classId: number;
}
