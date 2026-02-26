import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEmail,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateUserDto {
  @ApiProperty({ example: 'Nguyễn Văn A' })
  @IsString()
  @MaxLength(255)
  user_name: string;

  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  @MaxLength(255)
  email: string;

  @ApiProperty({ example: 'Password123!', minLength: 6 })
  @IsString()
  @MinLength(6, { message: 'Mật khẩu tối thiểu 6 ký tự' })
  @MaxLength(255)
  password: string;

  @ApiProperty({
    required: false,
    example: 'teacher',
    description: 'Vai trò: teacher, student, admin...',
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  role?: string;

  @ApiProperty({ required: false, example: 'https://example.com/avatar.png' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  profile_picture?: string;

  @ApiProperty({ required: false, example: true })
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;

  @ApiProperty({ required: false, example: 0, description: 'Số credit' })
  @IsOptional()
  @IsInt()
  credit?: number;
}
