import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class UpdateGroupDto {
  @ApiProperty({
    description: 'Name of the group',
    example: 'Nhóm 1 - Lập trình',
    required: false,
  })
  @IsString()
  @IsOptional()
  groupName?: string;
}
