import { ApiProperty } from '@nestjs/swagger';
import { Transform, Type, plainToInstance } from 'class-transformer';
import { Allow, IsDefined, ValidateNested } from 'class-validator';
import { CreateNewsDto } from './create-news.dto';

export class CreateNewsWithMediaDto {
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
    type: CreateNewsDto,
  })
  @IsDefined()
  @ValidateNested()
  @Type(() => CreateNewsDto)
  @Transform(
    ({ value }) => {
      try {
        const parsed = typeof value === 'string' ? JSON.parse(value) : value;
        return plainToInstance(CreateNewsDto, parsed);
      } catch {
        return value;
      }
    },
    { toClassOnly: true },
  )
  data: CreateNewsDto;
}
