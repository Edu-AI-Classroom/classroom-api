import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v4 as uuidv4 } from 'uuid';
import { ClassroomService } from '../classroom/classroom.service';
import { AuthUser } from '../auth/auth.service';
import { buildRtcToken } from './agora-token.builder';
import {
  AgoraParticipantDto,
  AgoraSessionDto,
  CreateAgoraSessionDto,
  UpdateAgoraParticipantDto,
} from './dtos';

type AgoraSessionStatus = 'ACTIVE' | 'ENDED';
type AgoraParticipantRole = 'TEACHER' | 'STUDENT';

interface AgoraParticipantRecord {
  userId: number;
  userName: string;
  role: AgoraParticipantRole;
  speakerEnabled: boolean;
  joinedAt: Date | null;
  leftAt: Date | null;
  tokenIssuedAt: Date | null;
  tokenExpiresAt: Date | null;
}

interface AgoraSessionRecord {
  sessionId: string;
  classId: number;
  className: string;
  channelName: string;
  title: string | null;
  status: AgoraSessionStatus;
  createdByUserId: number;
  createdByUserName: string;
  scheduledStartAt: Date | null;
  startedAt: Date | null;
  endedAt: Date | null;
  participants: Map<number, AgoraParticipantRecord>;
}

@Injectable()
export class AgoraService {
  private readonly sessions = new Map<string, AgoraSessionRecord>();

  constructor(
    private readonly configService: ConfigService,
    private readonly classroomService: ClassroomService,
  ) {}

  async createSession(
    user: AuthUser,
    classId: number,
    dto: CreateAgoraSessionDto,
  ): Promise<AgoraSessionDto> {
    this.assertEnvReady();
    await this.classroomService.getClassroom(classId, user.userId);

    const sessionId = uuidv4();
    const channelName = this.buildChannelName(classId, sessionId);
    const classroom = await this.classroomService.getClassroom(
      classId,
      user.userId,
    );

    const session: AgoraSessionRecord = {
      sessionId,
      classId,
      className: classroom.className,
      channelName,
      title: dto.title?.trim() || null,
      status: 'ACTIVE',
      createdByUserId: user.userId,
      createdByUserName: user.userName,
      scheduledStartAt: dto.scheduledStartAt
        ? new Date(dto.scheduledStartAt)
        : null,
      startedAt: new Date(),
      endedAt: null,
      participants: new Map<number, AgoraParticipantRecord>(),
    };

    this.sessions.set(sessionId, session);
    return this.toSessionDto(session);
  }

  async listSessions(
    classId: number,
    user: AuthUser,
  ): Promise<AgoraSessionDto[]> {
    await this.classroomService.getClassroom(classId, user.userId);
    return Array.from(this.sessions.values())
      .filter((session) => session.classId === classId)
      .map((session) => this.toSessionDto(session));
  }

  async getSession(
    classId: number,
    sessionId: string,
    user: AuthUser,
  ): Promise<AgoraSessionDto> {
    await this.classroomService.getClassroom(classId, user.userId);
    const session = this.getSessionOrThrow(classId, sessionId);
    return this.toSessionDto(session);
  }

  async issueToken(
    classId: number,
    sessionId: string,
    user: AuthUser,
    requestedSpeaker?: boolean,
  ) {
    const session = this.getActiveSessionOrThrow(classId, sessionId);
    await this.classroomService.getClassroom(classId, user.userId);
    this.assertEnvReady();

    const participant = this.upsertParticipant(session, user);
    const publish =
      user.role === 'TEACHER' || participant.speakerEnabled || requestedSpeaker;
    if (
      user.role !== 'TEACHER' &&
      requestedSpeaker &&
      !participant.speakerEnabled
    ) {
      throw new ForbiddenException(
        'Student must be promoted before receiving publish privileges',
      );
    }

    const ttlSeconds = this.getTokenTtlSeconds();
    const rtcToken = buildRtcToken({
      appId: this.getAgoraAppId(),
      appCertificate: this.getAgoraAppCertificate(),
      channelName: session.channelName,
      uid: user.userId,
      tokenTtlSeconds: ttlSeconds,
      publish,
    });

    const expireAt = new Date(Date.now() + ttlSeconds * 1000);
    participant.tokenIssuedAt = new Date();
    participant.tokenExpiresAt = expireAt;

    return {
      rtcToken,
      channelName: session.channelName,
      uid: user.userId,
      role: publish ? 'PUBLISHER' : 'SUBSCRIBER',
      expireAt: expireAt.toISOString(),
    };
  }

  async joinSession(
    classId: number,
    sessionId: string,
    user: AuthUser,
  ): Promise<AgoraSessionDto> {
    const session = this.getActiveSessionOrThrow(classId, sessionId);
    await this.classroomService.getClassroom(classId, user.userId);
    const participant = this.upsertParticipant(session, user);
    const now = new Date();
    participant.joinedAt ??= now;
    participant.leftAt = null;
    if (session.startedAt == null) {
      session.startedAt = now;
    }
    return this.toSessionDto(session);
  }

  async leaveSession(
    classId: number,
    sessionId: string,
    user: AuthUser,
  ): Promise<AgoraSessionDto> {
    const session = this.getSessionOrThrow(classId, sessionId);
    await this.classroomService.getClassroom(classId, user.userId);
    const participant = this.getParticipantOrThrow(session, user.userId);
    participant.leftAt = new Date();
    return this.toSessionDto(session);
  }

  async updateParticipant(
    classId: number,
    sessionId: string,
    participantId: number,
    user: AuthUser,
    dto: UpdateAgoraParticipantDto,
  ): Promise<AgoraSessionDto> {
    const session = this.getActiveSessionOrThrow(classId, sessionId);
    await this.assertTeacherAccess(classId, user);
    const participant = this.getParticipantOrThrow(session, participantId);
    participant.speakerEnabled = dto.speakerEnabled;
    return this.toSessionDto(session);
  }

  async endSession(
    classId: number,
    sessionId: string,
    user: AuthUser,
  ): Promise<AgoraSessionDto> {
    const session = this.getActiveSessionOrThrow(classId, sessionId);
    await this.assertTeacherAccess(classId, user);
    session.status = 'ENDED';
    session.endedAt = new Date();
    return this.toSessionDto(session);
  }

  private async assertTeacherAccess(classId: number, user: AuthUser) {
    if (user.role !== 'TEACHER' && user.role !== 'ADMIN') {
      throw new ForbiddenException('Only teachers can manage the live session');
    }
    await this.classroomService.getClassroom(classId, user.userId);
  }

  private upsertParticipant(
    session: AgoraSessionRecord,
    user: AuthUser,
  ): AgoraParticipantRecord {
    const existing = session.participants.get(user.userId);
    if (existing) {
      existing.userName = user.userName;
      existing.role = user.role === 'TEACHER' ? 'TEACHER' : 'STUDENT';
      return existing;
    }

    const participant: AgoraParticipantRecord = {
      userId: user.userId,
      userName: user.userName,
      role: user.role === 'TEACHER' ? 'TEACHER' : 'STUDENT',
      speakerEnabled: user.role === 'TEACHER',
      joinedAt: null,
      leftAt: null,
      tokenIssuedAt: null,
      tokenExpiresAt: null,
    };
    session.participants.set(user.userId, participant);
    return participant;
  }

  private getParticipantOrThrow(
    session: AgoraSessionRecord,
    participantId: number,
  ): AgoraParticipantRecord {
    const participant = session.participants.get(participantId);
    if (!participant) {
      throw new NotFoundException('Participant not found in this session');
    }
    return participant;
  }

  private getSessionOrThrow(
    classId: number,
    sessionId: string,
  ): AgoraSessionRecord {
    const session = this.sessions.get(sessionId);
    if (!session || session.classId !== classId) {
      throw new NotFoundException('Agora session not found');
    }
    return session;
  }

  private getActiveSessionOrThrow(
    classId: number,
    sessionId: string,
  ): AgoraSessionRecord {
    const session = this.getSessionOrThrow(classId, sessionId);
    if (session.status === 'ENDED') {
      throw new BadRequestException('This Agora session has already ended');
    }
    return session;
  }

  private buildChannelName(classId: number, sessionId: string): string {
    const prefix =
      this.configService.get<string>('agora.channelPrefix') ?? 'classroom';
    return `${prefix}_${classId}_${sessionId}`;
  }

  private getAgoraAppId(): string {
    return this.configService.get<string>('agora.appId') ?? '';
  }

  private getAgoraAppCertificate(): string {
    return this.configService.get<string>('agora.appCertificate') ?? '';
  }

  private getTokenTtlSeconds(): number {
    return this.configService.get<number>('agora.tokenTtlSeconds') ?? 3600;
  }

  private assertEnvReady(): void {
    if (!this.getAgoraAppId() || !this.getAgoraAppCertificate()) {
      throw new ServiceUnavailableException(
        'Agora env is missing: AGORA_APP_ID or AGORA_APP_CERTIFICATE',
      );
    }
  }

  private toSessionDto(session: AgoraSessionRecord): AgoraSessionDto {
    const participants = Array.from(session.participants.values()).map(
      (participant) => this.toParticipantDto(participant),
    );
    return {
      sessionId: session.sessionId,
      classId: session.classId,
      channelName: session.channelName,
      status: session.status,
      createdByUserId: session.createdByUserId,
      createdByUserName: session.createdByUserName,
      title: session.title,
      scheduledStartAt: session.scheduledStartAt?.toISOString() ?? null,
      startedAt: session.startedAt?.toISOString() ?? null,
      endedAt: session.endedAt?.toISOString() ?? null,
      participantCount: participants.filter(
        (participant) => participant.leftAt == null,
      ).length,
      attendanceCount: participants.filter(
        (participant) => participant.joinedAt != null,
      ).length,
      participants,
    };
  }

  private toParticipantDto(
    participant: AgoraParticipantRecord,
  ): AgoraParticipantDto {
    return {
      userId: participant.userId,
      userName: participant.userName,
      role: participant.role,
      speakerEnabled: participant.speakerEnabled,
      joinedAt: participant.joinedAt?.toISOString() ?? null,
      leftAt: participant.leftAt?.toISOString() ?? null,
    };
  }
}
