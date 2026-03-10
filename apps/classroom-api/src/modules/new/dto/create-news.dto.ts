import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsIn,
  IsBoolean,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateNewsDto {
  @ApiProperty({ example: 1, description: 'ID của lớp học' })
  @IsInt()
  @Type(() => Number)
  @IsNotEmpty()
  classId: number; // camelCase theo chuẩn

  @ApiPropertyOptional({ example: 'Nội dung thông báo...' })
  @IsString()
  @IsNotEmpty()
  content: string; // Đổi thành bắt buộc vì đây là thứ duy nhất người dùng nhập

  @ApiPropertyOptional({ example: 'all', enum: ['students', 'parents', 'all'] })
  @IsString()
  @IsIn(['students', 'parents', 'all'])
  @IsOptional()
  audience?: 'students' | 'parents' | 'all' = 'all';

  @ApiPropertyOptional({ example: false })
  @IsBoolean()
  @IsOptional()
  isPinned?: boolean = false;
}
