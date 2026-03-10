import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty } from 'class-validator';

export class AssignStudentToGroupDto {
  @ApiProperty({
    description: 'Student ID to assign to the group',
    example: 5,
  })
  @IsInt()
  @IsNotEmpty()
  studentId: number;
}
