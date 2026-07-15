import { ApiProperty } from '@nestjs/swagger';

export class AgoraTokenDto {
  @ApiProperty({ example: '00000000000000000000000000000000' })
  appId: string;

  @ApiProperty({ example: '007...' })
  rtcToken: string;

  @ApiProperty({ example: 'classroom_1_7b0d4d45-0f5d-4c05-83b4-e2a2d5d5d2bb' })
  channelName: string;

  @ApiProperty({ example: 1001 })
  uid: number;

  @ApiProperty({ example: 'PUBLISHER' })
  role: string;

  @ApiProperty({ example: '2026-07-04T09:00:00.000Z' })
  expireAt: string;
}
