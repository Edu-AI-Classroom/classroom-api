import { ApiProperty } from '@nestjs/swagger';

export class GroupResponseDto {
  @ApiProperty({
    description: 'Group ID',
    example: 1,
  })
  groupId: number;

  @ApiProperty({
    description: 'Group name',
    example: 'Nhóm 1 - Lập trình',
  })
  groupName: string;

  @ApiProperty({
    description: 'Classroom ID this group belongs to',
    example: 1,
  })
  classId: number;

  @ApiProperty({
    description: 'Creation date',
    example: '2026-01-25T11:48:00.000Z',
  })
  createdAt: string;

  @ApiProperty({
    description: 'Last updated date',
    example: '2026-01-25T11:48:00.000Z',
  })
  updatedAt: string;

  @ApiProperty({
    description: 'Number of students in this group',
    example: 5,
  })
  studentCount?: number;

  @ApiProperty({
    description: 'List of students in this group',
    type: 'array',
    example: [
      {
        studentId: 5,
        studentName: 'Nguyễn Văn B',
        email: 'student@example.com',
      },
    ],
  })
  students?: Array<{
    studentId: number;
    studentName: string;
    email: string;
  }>;
}
