import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty } from 'class-validator';

export class AddTeacherDto {
  @ApiProperty({
    description: 'Email of the teacher to add to the classroom',
    example: 'teacher@example.com',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;
}
