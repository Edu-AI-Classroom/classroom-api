import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateGroupDto {
  @ApiProperty({
    description: 'Name of the group',
    example: 'Nhóm 1 - Lập trình',
  })
  @IsString()
  @IsNotEmpty()
  groupName: string;
}
