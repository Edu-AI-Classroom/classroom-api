import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsNumberString,
} from 'class-validator';

export class CreateCommentDto {
  @ApiPropertyOptional({ example: 1, description: 'ID bình luận cha' })
  @IsOptional()
  parentCommentId?: number; // camelCase

  @ApiProperty({ example: '1', description: 'ID bài tin tức' })
  @IsNotEmpty()
  newsId: string | number; // Frontend coi id bài viết là string, DB backend là số, nên linh hoạt ở đây

  @ApiProperty({ example: 'Bài viết rất hữu ích!' })
  @IsString()
  @IsNotEmpty()
  content: string;

  // Lưu ý: Không cần user_id ở đây nữa, vì backend lấy từ Token thông qua @CurrentUser giống như NewsController
}
