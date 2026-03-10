import { ApiProperty } from '@nestjs/swagger';

export class TeacherResponseDto {
  @ApiProperty({
    description: 'Teacher ID (User ID)',
    example: 1,
  })
  teacherId: number;

  @ApiProperty({
    description: 'Teacher name',
    example: 'Nguyễn Văn A',
  })
  teacherName: string;

  @ApiProperty({
    description: 'Teacher email',
    example: 'teacher@example.com',
  })
  email: string;

  @ApiProperty({
    description: 'Date added to the classroom',
    example: '2026-01-25T11:48:00.000Z',
  })
  addedAt?: string;

  @ApiProperty({
    description: 'Is this teacher the owner of the classroom',
    example: true,
  })
  isOwner: boolean;
}
