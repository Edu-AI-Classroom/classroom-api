import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AgoraParticipantDto {
  @ApiProperty({ example: 1001 })
  userId: number;

  @ApiProperty({ example: 'Nguyen Van A' })
  userName: string;

  @ApiProperty({ example: 'TEACHER' })
  role: string;

  @ApiProperty({ example: true })
  speakerEnabled: boolean;

  @ApiPropertyOptional({ example: '2026-07-04T08:00:00.000Z' })
  joinedAt?: string | null;

  @ApiPropertyOptional({ example: '2026-07-04T09:00:00.000Z' })
  leftAt?: string | null;
}

export class AgoraSessionDto {
  @ApiProperty({ example: '7b0d4d45-0f5d-4c05-83b4-e2a2d5d5d2bb' })
  sessionId: string;

  @ApiProperty({ example: 1 })
  classId: number;

  @ApiProperty({ example: 'classroom_1_7b0d4d45-0f5d-4c05-83b4-e2a2d5d5d2bb' })
  channelName: string;

  @ApiProperty({ example: 'ACTIVE' })
  status: string;

  @ApiProperty({ example: 1001 })
  createdByUserId: number;

  @ApiProperty({ example: 'Nguyen Van A' })
  createdByUserName: string;

  @ApiPropertyOptional({ example: 'Live lecture session' })
  title?: string | null;

  @ApiPropertyOptional({ example: '2026-07-04T08:00:00.000Z' })
  scheduledStartAt?: string | null;

  @ApiPropertyOptional({ example: '2026-07-04T08:01:10.000Z' })
  startedAt?: string | null;

  @ApiPropertyOptional({ example: '2026-07-04T09:01:10.000Z' })
  endedAt?: string | null;

  @ApiProperty({ example: 12 })
  participantCount: number;

  @ApiProperty({ example: 12 })
  attendanceCount: number;

  @ApiProperty({ type: [AgoraParticipantDto] })
  participants: AgoraParticipantDto[];
}
