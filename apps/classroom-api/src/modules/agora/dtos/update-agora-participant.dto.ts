import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class UpdateAgoraParticipantDto {
  @ApiProperty({
    description: 'Whether the participant can publish audio/video',
    example: true,
  })
  @IsBoolean()
  speakerEnabled: boolean;
}
