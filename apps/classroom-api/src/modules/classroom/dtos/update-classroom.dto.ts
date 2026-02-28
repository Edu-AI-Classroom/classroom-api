import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class UpdateClassroomDto {
  @ApiProperty({
    description: 'Name of the classroom',
    example: 'Lớp 6A - Toán Nâng Cao',
    required: false,
  })
  @IsString()
  @IsOptional()
  className?: string;

  @ApiProperty({
    description: 'Grade level (1-12)',
    example: 6,
    minimum: 1,
    maximum: 12,
    required: false,
  })
  @IsInt()
  @IsOptional()
  @Min(1)
  @Max(12)
  gradeLevel?: number;

  @ApiProperty({
    description: 'Subject ID',
    example: 1,
    required: false,
  })
  @IsInt()
  @IsOptional()
  subjectId?: number;
}
