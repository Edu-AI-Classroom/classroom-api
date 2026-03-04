import { ApiProperty } from '@nestjs/swagger';

export class ClassroomResponseDto {
  @ApiProperty({
    description: 'Classroom ID',
    example: 1,
  })
  classId: number;

  @ApiProperty({
    description: 'Classroom name',
    example: 'Lớp 6A - Toán Nâng Cao',
  })
  className: string;

  @ApiProperty({
    description: 'Grade level',
    example: 6,
  })
  gradeLevel: number;

  @ApiProperty({
    description: 'Subject ID',
    example: 1,
  })
  subjectId: number;

  @ApiProperty({
    description: 'Subject name',
    example: 'Toán học',
  })
  subjectName?: string;

  @ApiProperty({
    description: 'Teacher who created the classroom',
    example: 1,
  })
  createdBy: number;

  @ApiProperty({
    description: 'Creator name',
    example: 'Nguyễn Văn A',
  })
  createdByName?: string;

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
    description: 'Is classroom soft deleted',
    example: false,
  })
  isDeleted: boolean;

  @ApiProperty({
    description: 'Number of students in the classroom',
    example: 25,
  })
  studentCount?: number;

  @ApiProperty({
    description: 'Number of teachers in the classroom',
    example: 2,
  })
  teacherCount?: number;

  @ApiProperty({
    description: 'Number of groups in the classroom',
    example: 5,
  })
  groupCount?: number;

  @ApiProperty({
    description: 'Is user the owner of this classroom',
    example: true,
  })
  isOwner?: boolean;
}
