import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString } from 'class-validator';

export class AddStudentDto {
  @ApiProperty({
    description: 'Student email address',
    example: 'student@example.com',
    required: false,
  })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiProperty({
    description: 'Student name (used if student does not exist)',
    example: 'Nguyễn Văn B',
    required: false,
  })
  @IsString()
  @IsOptional()
  studentName?: string;
}
