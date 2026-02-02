import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsString, Max, Min } from 'class-validator';

export class CreateClassroomDto {
  @ApiProperty({
    description: 'Name of the classroom',
    example: 'Lớp 6A - Toán Nâng Cao',
  })
  @IsString()
  @IsNotEmpty()
  className: string;

  @ApiProperty({
    description: 'Grade level (1-12)',
    example: 6,
    minimum: 1,
    maximum: 12,
  })
  @IsInt()
  @IsNotEmpty()
  @Min(1)
  @Max(12)
  gradeLevel: number;

  @ApiProperty({
    description: 'Subject ID',
    example: 1,
  })
  @IsInt()
  @IsNotEmpty()
  subjectId: number;
}
