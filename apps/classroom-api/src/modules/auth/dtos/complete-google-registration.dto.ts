import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsNotEmpty, IsString } from 'class-validator';

export class CompleteGoogleRegistrationDto {
  @ApiProperty({ example: 'Nguyễn Văn A' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    example: 'STUDENT',
    enum: ['STUDENT', 'TEACHER'],
  })
  @IsIn(['STUDENT', 'TEACHER'])
  role: 'STUDENT' | 'TEACHER';
}
