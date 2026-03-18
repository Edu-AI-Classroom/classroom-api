import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class JoinClassDto {
  @ApiProperty({
    description: 'Classroom code (currently the classroom ID)',
    example: '1',
  })
  @IsNotEmpty()
  @IsString()
  classCode: string;
}
