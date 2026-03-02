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
    description: 'Student profile picture URL',
    example: 'https://example.com/profile.jpg',
    required: false,
  })
  profilePicture?: string;

  @ApiProperty({
    description: 'User role',
    example: 'STUDENT',
    required: false,
  })
  role?: string;

  @ApiProperty({
    description: 'Account credit balance',
    example: 100,
    required: false,
  })
  credit?: number;

  @ApiProperty({
    description: 'Account active status',
    example: true,
    required: false,
  })
  isActive?: boolean;

  @ApiProperty({
    description: 'Student grade level',
    example: 6,
    required: false,
  })
  gradeLevel?: number;

  @ApiProperty({
    description: 'Parent phone number',
    example: '0912345678',
    required: false,
  })
  parentPhone?: string;

  @ApiProperty({
    description: 'User created date',
    example: '2026-01-01T10:00:00.000Z',
    required: false,
  })
  createdAt?: string;

  @ApiProperty({
    description: 'Date joined the classroom',
    example: '2026-01-25T11:48:00.000Z',
    required: false,
  })
  joinedAt?: string;

  @ApiProperty({
    description: 'Current group in this classroom (if any)',
    example: 1,
    required: false,
  })
  groupId?: number;

  @ApiProperty({
    description: 'Current group name',
    example: 'Nhóm 1',
    required: false,
  })
  groupName?: string;
}
