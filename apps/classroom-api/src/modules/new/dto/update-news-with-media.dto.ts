// src/news/dto/update-news-with-media.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { Transform, Type, plainToInstance } from 'class-transformer';
import { Allow, IsDefined, ValidateNested } from 'class-validator';
import { UpdateNewsDto } from './update-news.dto';

export class UpdateNewsWithMediaDto {
  @ApiProperty({
    type: 'string',
    format: 'binary',
    description: 'Image or Video file attachment',
    required: false,
  })
  @Allow()
  file?: any;

  @ApiProperty({
    description: 'News Data (JSON string)',
    type: UpdateNewsDto,
  })
  @IsDefined()
  @ValidateNested()
  @Type(() => UpdateNewsDto)
  @Transform(
    ({ value }) => {
      try {
        const parsed = typeof value === 'string' ? JSON.parse(value) : value;
        return plainToInstance(UpdateNewsDto, parsed);
      } catch {
        return value;
      }
    },
    { toClassOnly: true },
  )
  data: UpdateNewsDto;
}
