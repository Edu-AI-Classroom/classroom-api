import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v4 as uuidv4 } from 'uuid';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import type { AuthUser } from '../auth/auth.service';
import { ClassroomService } from '../classroom/classroom.service';
import { buildRtcToken } from './agora-token.builder';
import {
  AgoraConversationCallDto,
  AgoraParticipantDto,
  AgoraSessionDto,
  CreateAgoraSessionDto,
  UpdateAgoraParticipantDto,
} from './dtos';

type AgoraSessionStatus = 'ACTIVE' | 'ENDED';
type AgoraParticipantRole = 'TEACHER' | 'STUDENT';
type AgoraConversationCallStatus = 'RINGING' | 'ACTIVE' | 'DECLINED' | 'ENDED';

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

interface AgoraConversationCallRecord {
  callId: string;
  conversationId: number;
  classId: number;
  className: string | null;
  studentName: string | null;
  channelName: string;
  status: AgoraConversationCallStatus;
  callerId: number;
  callerName: string;
  recipientId: number;
  recipientName: string;
  createdAt: Date;
  acceptedAt: Date | null;
  endedAt: Date | null;
}

@Injectable()
export class AgoraService {
  private readonly sessions = new Map<string, AgoraSessionRecord>();
  private readonly conversationCalls = new Map<
    string,
    AgoraConversationCallRecord
  >();

  constructor(
    private readonly configService: ConfigService,
    private readonly classroomService: ClassroomService,
    private readonly prisma: PrismaService,
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
      appId: this.getAgoraAppId(),
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

  async startConversationCall(
    conversationId: number,
    user: AuthUser,
  ): Promise<AgoraConversationCallDto> {
    this.assertEnvReady();
    const conversation = await this.verifyConversationAccess(
      user.userId,
      conversationId,
    );
    const recipient = this.getConversationRecipient(conversation, user.userId);

    const existing = Array.from(this.conversationCalls.values()).find(
      (call) =>
        call.conversationId === conversationId &&
        (call.status === 'RINGING' || call.status === 'ACTIVE'),
    );
    if (existing) {
      return this.toConversationCallDto(existing, user.userId);
    }

    const callId = uuidv4();
    const call: AgoraConversationCallRecord = {
      callId,
      conversationId,
      classId: conversation.class_id,
      className: conversation.classroom?.class_name ?? null,
      studentName: conversation.student?.USER?.user_name ?? null,
      channelName: this.buildConversationCallChannelName(
        conversationId,
        callId,
      ),
      status: 'RINGING',
      callerId: user.userId,
      callerName: user.userName,
      recipientId: recipient.userId,
      recipientName: recipient.userName,
      createdAt: new Date(),
      acceptedAt: null,
      endedAt: null,
    };
    this.conversationCalls.set(callId, call);
    return this.toConversationCallDto(call, user.userId);
  }

  async listActiveConversationCalls(
    user: AuthUser,
  ): Promise<AgoraConversationCallDto[]> {
    this.expireStaleRingingCalls();
    return Array.from(this.conversationCalls.values())
      .filter(
        (call) =>
          (call.callerId === user.userId || call.recipientId === user.userId) &&
          (call.status === 'RINGING' || call.status === 'ACTIVE'),
      )
      .map((call) => this.toConversationCallDto(call, user.userId));
  }

  async getConversationCall(
    callId: string,
    user: AuthUser,
  ): Promise<AgoraConversationCallDto> {
    const call = this.getConversationCallOrThrow(callId);
    this.assertConversationCallParticipant(call, user.userId);
    return this.toConversationCallDto(call, user.userId);
  }

  async acceptConversationCall(
    callId: string,
    user: AuthUser,
  ): Promise<AgoraConversationCallDto> {
    const call = this.getConversationCallOrThrow(callId);
    this.assertConversationCallParticipant(call, user.userId);
    if (call.recipientId !== user.userId) {
      throw new ForbiddenException('Only the call recipient can accept');
    }
    if (call.status !== 'RINGING') {
      throw new BadRequestException('This call is not ringing');
    }
    call.status = 'ACTIVE';
    call.acceptedAt = new Date();
    return this.toConversationCallDto(call, user.userId);
  }

  async declineConversationCall(
    callId: string,
    user: AuthUser,
  ): Promise<AgoraConversationCallDto> {
    const call = this.getConversationCallOrThrow(callId);
    this.assertConversationCallParticipant(call, user.userId);
    if (call.recipientId !== user.userId) {
      throw new ForbiddenException('Only the call recipient can decline');
    }
    call.status = 'DECLINED';
    call.endedAt = new Date();
    return this.toConversationCallDto(call, user.userId);
  }

  async endConversationCall(
    callId: string,
    user: AuthUser,
  ): Promise<AgoraConversationCallDto> {
    const call = this.getConversationCallOrThrow(callId);
    this.assertConversationCallParticipant(call, user.userId);
    call.status = 'ENDED';
    call.endedAt = new Date();
    return this.toConversationCallDto(call, user.userId);
  }

  async issueConversationCallToken(callId: string, user: AuthUser) {
    const call = this.getConversationCallOrThrow(callId);
    this.assertConversationCallParticipant(call, user.userId);
    if (call.status !== 'ACTIVE') {
      throw new BadRequestException('This call has not been accepted yet');
    }
    this.assertEnvReady();

    const ttlSeconds = this.getTokenTtlSeconds();
    return {
      appId: this.getAgoraAppId(),
      rtcToken: buildRtcToken({
        appId: this.getAgoraAppId(),
        appCertificate: this.getAgoraAppCertificate(),
        channelName: call.channelName,
        uid: user.userId,
        tokenTtlSeconds: ttlSeconds,
        publish: true,
      }),
      channelName: call.channelName,
      uid: user.userId,
      role: 'PUBLISHER',
      expireAt: new Date(Date.now() + ttlSeconds * 1000).toISOString(),
    };
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

  private buildConversationCallChannelName(
    conversationId: number,
    callId: string,
  ): string {
    const prefix =
      this.configService.get<string>('agora.channelPrefix') ?? 'classroom';
    return `${prefix}_conversation_${conversationId}_${callId}`;
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

  private async verifyConversationAccess(
    userId: number,
    conversationId: number,
  ) {
    const prisma = this.prisma as any;
    const conversation = await prisma.conversation.findUnique({
      where: { conversation_id: conversationId },
      include: {
        classroom: true,
        student: {
          include: { USER: { select: { user_id: true, user_name: true } } },
        },
        parent: {
          include: { USER: { select: { user_id: true, user_name: true } } },
        },
        teacher_classroom: {
          include: { USER: { select: { user_id: true, user_name: true } } },
        },
      },
    });
    if (!conversation) throw new NotFoundException('Conversation not found');

    const hasAccess =
      conversation.teacher_id === userId ||
      conversation.student_id === userId ||
      conversation.parent_id === userId;
    if (!hasAccess) {
      throw new ForbiddenException(
        'You do not have access to this conversation',
      );
    }
    return conversation;
  }

  private getConversationRecipient(conversation: any, callerId: number) {
    if (conversation.teacher_id === callerId) {
      if (conversation.conversation_type === 'PARENT_TEACHER') {
        if (!conversation.parent_id) {
          throw new BadRequestException('Conversation has no parent recipient');
        }
        return {
          userId: conversation.parent_id,
          userName: conversation.parent?.USER?.user_name ?? 'Parent',
        };
      }
      return {
        userId: conversation.student_id,
        userName: conversation.student?.USER?.user_name ?? 'Student',
      };
    }

    if (
      conversation.parent_id === callerId ||
      conversation.student_id === callerId
    ) {
      return {
        userId: conversation.teacher_id,
        userName: conversation.teacher_classroom?.USER?.user_name ?? 'Teacher',
      };
    }

    throw new ForbiddenException('You cannot call this conversation');
  }

  private getConversationCallOrThrow(callId: string) {
    const call = this.conversationCalls.get(callId);
    if (!call) throw new NotFoundException('Conversation call not found');
    return call;
  }

  private assertConversationCallParticipant(
    call: AgoraConversationCallRecord,
    userId: number,
  ) {
    if (call.callerId !== userId && call.recipientId !== userId) {
      throw new ForbiddenException('You are not part of this call');
    }
  }

  private expireStaleRingingCalls() {
    const cutoff = Date.now() - 60_000;
    for (const call of this.conversationCalls.values()) {
      if (call.status === 'RINGING' && call.createdAt.getTime() < cutoff) {
        call.status = 'ENDED';
        call.endedAt = new Date();
      }
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

  private toConversationCallDto(
    call: AgoraConversationCallRecord,
    viewerId: number,
  ): AgoraConversationCallDto {
    return {
      callId: call.callId,
      conversationId: call.conversationId,
      classId: call.classId,
      className: call.className,
      studentName: call.studentName,
      channelName: call.channelName,
      status: call.status,
      callerId: call.callerId,
      callerName: call.callerName,
      recipientId: call.recipientId,
      recipientName: call.recipientName,
      incoming: call.recipientId === viewerId && call.status === 'RINGING',
      createdAt: call.createdAt.toISOString(),
      acceptedAt: call.acceptedAt?.toISOString() ?? null,
      endedAt: call.endedAt?.toISOString() ?? null,
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
