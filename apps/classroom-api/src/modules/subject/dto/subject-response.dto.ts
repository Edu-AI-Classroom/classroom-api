import { ApiProperty } from '@nestjs/swagger';

export class SubjectResponseDto {
  @ApiProperty()
  subject_id: number;

  @ApiProperty()
  subject_name: string;
}
