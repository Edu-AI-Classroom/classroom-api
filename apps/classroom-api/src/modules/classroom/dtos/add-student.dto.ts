import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty } from 'class-validator';

export class AddStudentDto {
  @ApiProperty({
    description: 'Student email address (must exist in the system)',
    example: 'student@example.com',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;
}
