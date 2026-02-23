import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateCommentDto {
  @ApiPropertyOptional({
    example: null,
    description: 'ID của bình luận cha (nếu là reply)',
  })
  @IsInt()
  @IsOptional()
  parent_comment_id?: number;

  @ApiProperty({ example: 1, description: 'ID bài tin tức' })
  @IsInt()
  @IsNotEmpty()
  news_id: number;

  @ApiProperty({ example: 1, description: 'ID người bình luận' })
  @IsInt()
  @IsNotEmpty()
  user_id: number;

  @ApiProperty({ example: 'Bài viết rất hữu ích!' })
  @IsString()
  @IsNotEmpty()
  content: string;
}
