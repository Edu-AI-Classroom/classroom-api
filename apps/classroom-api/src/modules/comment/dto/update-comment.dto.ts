import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class UpdateCommentDto {
  @ApiProperty({ example: 'Nội dung bình luận đã chỉnh sửa' })
  @IsString()
  @IsNotEmpty()
  content: string;
}
