import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsOptional, IsString } from 'class-validator';

export class CreateAgoraSessionDto {
  @ApiPropertyOptional({
    description: 'Optional session title',
    example: 'Unit 3 live lecture',
  })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({
    description: 'Optional scheduled start time',
    example: '2026-07-04T08:00:00.000Z',
  })
  @IsOptional()
  @IsDateString()
  scheduledStartAt?: string;
}
