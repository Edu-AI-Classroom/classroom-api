import { ApiProperty } from '@nestjs/swagger';

export class StudentResponseDto {
  @ApiProperty({
    description: 'Student ID (User ID)',
    example: 5,
  })
  studentId: number;

  @ApiProperty({
    description: 'Student name',
    example: 'Nguyễn Văn B',
  })
  studentName: string;

  @ApiProperty({
    description: 'Student email',
    example: 'student@example.com',
  })
  email: string;

  @ApiProperty({
    description: 'Student grade level',
    example: 6,
  })
  gradeLevel?: number;

  @ApiProperty({
    description: 'Date joined the classroom',
    example: '2026-01-25T11:48:00.000Z',
  })
  joinedAt?: string;

  @ApiProperty({
    description: 'Current group in this classroom (if any)',
    example: 1,
  })
  groupId?: number;

  @ApiProperty({
    description: 'Current group name',
    example: 'Nhóm 1',
  })
  groupName?: string;
}
