import { ApiProperty } from '@nestjs/swagger';

export class NewsResponseDto {
  @ApiProperty()
  newsId: number;

  @ApiProperty()
  classId: number;

  @ApiProperty()
  title: string;

  @ApiProperty({ required: false })
  content?: string;

  @ApiProperty({ required: false })
  mediaUrl?: string;

  @ApiProperty()
  status: string;

  @ApiProperty()
  authorName: string;

  @ApiProperty()
  uploadedAt: string;

  @ApiProperty({ required: false })
  updatedAt?: string;
}
