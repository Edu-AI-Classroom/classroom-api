import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { NotificationService } from '../notification/notification.service';
import { CreateMessageDto } from './dtos';

const MAX_ATTACHMENTS = 5;
const MAX_ATTACHMENT_SIZE = 10 * 1024 * 1024;
const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
]);

@Injectable()
export class ChatService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationService: NotificationService,
  ) {}

  async createParentConversation(
    parentId: number,
    studentId: number,
    classId: number,
  ) {
    const prisma = this.prisma as any;
    await this.verifyParentStudent(parentId, studentId);

    const classStudent = await prisma.class_student.findUnique({
      where: {
        class_id_student_id: { class_id: classId, student_id: studentId },
      },
    });
    if (!classStudent)
      throw new ForbiddenException('Student is not in this class');

    const owner = await prisma.teacher_classroom.findFirst({
      where: { class_id: classId, is_owner: true },
    });
    if (!owner) throw new NotFoundException('Class owner teacher not found');

    const existing = await prisma.conversation.findFirst({
      where: {
        class_id: classId,
        student_id: studentId,
        parent_id: parentId,
        teacher_id: owner.teacher_id,
        conversation_type: 'PARENT_TEACHER',
      },
      include: this.conversationInclude(),
    });

    const conversation =
      existing ??
      (await prisma.conversation.create({
        data: {
          conversation_type: 'PARENT_TEACHER',
          class_id: classId,
          student_id: studentId,
          parent_id: parentId,
          teacher_id: owner.teacher_id,
        },
        include: this.conversationInclude(),
      }));

    return this.mapConversation(conversation, parentId);
  }

  async createStudentConversation(studentId: number, classId: number) {
    const prisma = this.prisma as any;
    await this.verifyStudentInClass(studentId, classId);

    const owner = await prisma.teacher_classroom.findFirst({
      where: { class_id: classId, is_owner: true },
    });
    if (!owner) throw new NotFoundException('Class owner teacher not found');

    const existing = await prisma.conversation.findFirst({
      where: {
        class_id: classId,
        student_id: studentId,
        teacher_id: owner.teacher_id,
        parent_id: null,
        conversation_type: 'STUDENT_TEACHER',
      },
      include: this.conversationInclude(),
    });

    const conversation =
      existing ??
      (await prisma.conversation.create({
        data: {
          conversation_type: 'STUDENT_TEACHER',
          class_id: classId,
          student_id: studentId,
          teacher_id: owner.teacher_id,
        },
        include: this.conversationInclude(),
      }));

    return this.mapConversation(conversation, studentId);
  }

  async createTeacherStudentConversation(
    teacherId: number,
    classId: number,
    studentId: number,
  ) {
    const prisma = this.prisma as any;
    await this.verifyTeacherOwnsClass(teacherId, classId);
    await this.verifyStudentInClass(studentId, classId);

    const existing = await prisma.conversation.findFirst({
      where: {
        class_id: classId,
        student_id: studentId,
        teacher_id: teacherId,
        parent_id: null,
        conversation_type: 'STUDENT_TEACHER',
      },
      include: this.conversationInclude(),
    });

    const conversation =
      existing ??
      (await prisma.conversation.create({
        data: {
          conversation_type: 'STUDENT_TEACHER',
          class_id: classId,
          student_id: studentId,
          teacher_id: teacherId,
        },
        include: this.conversationInclude(),
      }));

    return this.mapConversation(conversation, teacherId);
  }

  async createTeacherParentConversation(
    teacherId: number,
    classId: number,
    studentId: number,
  ) {
    const prisma = this.prisma as any;
    await this.verifyTeacherOwnsClass(teacherId, classId);
    await this.verifyStudentInClass(studentId, classId);

    const linkedParent = await prisma.parent_student.findFirst({
      where: { student_id: studentId, status: 'ACTIVE' },
      orderBy: [{ linked_at: 'desc' }, { parent_id: 'asc' }],
    });

    if (!linkedParent) {
      throw new NotFoundException('Student has no linked parent');
    }

    const existing = await prisma.conversation.findFirst({
      where: {
        class_id: classId,
        student_id: studentId,
        parent_id: linkedParent.parent_id,
        teacher_id: teacherId,
        conversation_type: 'PARENT_TEACHER',
      },
      include: this.conversationInclude(),
    });

    const conversation =
      existing ??
      (await prisma.conversation.create({
        data: {
          conversation_type: 'PARENT_TEACHER',
          class_id: classId,
          student_id: studentId,
          parent_id: linkedParent.parent_id,
          teacher_id: teacherId,
        },
        include: this.conversationInclude(),
      }));

    return this.mapConversation(conversation, teacherId);
  }

  async getParentConversations(parentId: number) {
    const prisma = this.prisma as any;
    const conversations = await prisma.conversation.findMany({
      where: { parent_id: parentId, conversation_type: 'PARENT_TEACHER' },
      include: this.conversationInclude(),
      orderBy: [{ last_message_at: 'desc' }, { created_at: 'desc' }],
    });
    return conversations.map((c: any) => this.mapConversation(c, parentId));
  }

  async getStudentConversations(studentId: number, classId?: number) {
    const prisma = this.prisma as any;
    const conversations = await prisma.conversation.findMany({
      where: {
        student_id: studentId,
        parent_id: null,
        conversation_type: 'STUDENT_TEACHER',
        ...(classId ? { class_id: classId } : {}),
      },
      include: this.conversationInclude(),
      orderBy: [{ last_message_at: 'desc' }, { created_at: 'desc' }],
    });
    return conversations.map((c: any) => this.mapConversation(c, studentId));
  }

  async getTeacherConversations(teacherId: number, classId?: number) {
    const prisma = this.prisma as any;
    const conversations = await prisma.conversation.findMany({
      where: {
        teacher_id: teacherId,
        ...(classId ? { class_id: classId } : {}),
        teacher_classroom: { is_owner: true },
      },
      include: this.conversationInclude(),
      orderBy: [{ last_message_at: 'desc' }, { created_at: 'desc' }],
    });
    return conversations.map((c: any) => this.mapConversation(c, teacherId));
  }

  async getMessages(
    userId: number,
    conversationId: number,
    cursor?: number,
    limit = 30,
  ) {
    await this.verifyConversationAccess(userId, conversationId);
    const prisma = this.prisma as any;
    const take = Math.min(Math.max(Number(limit) || 30, 1), 50);

    const messages = await prisma.message.findMany({
      where: {
        conversation_id: conversationId,
        deleted_at: null,
        ...(cursor ? { message_id: { lt: cursor } } : {}),
      },
      include: {
        sender: {
          select: {
            user_id: true,
            user_name: true,
            role: true,
            profile_picture: true,
          },
        },
        message_attachment: true,
        message_read: true,
      },
      orderBy: { message_id: 'desc' },
      take,
    });

    return messages.reverse().map((m: any) => this.mapMessage(m));
  }

  async createMessage(
    userId: number,
    conversationId: number,
    dto: CreateMessageDto,
  ) {
    await this.verifyConversationAccess(userId, conversationId);
    this.validateMessage(dto);

    const prisma = this.prisma as any;
    const now = new Date();
    const message = await prisma.$transaction(async (tx: any) => {
      const created = await tx.message.create({
        data: {
          conversation_id: conversationId,
          sender_id: userId,
          body: dto.body?.trim() || null,
          message_attachment: {
            create:
              dto.attachments?.map((a) => ({
                file_url: a.fileUrl,
                file_name: a.fileName,
                mime_type: a.mimeType,
                file_size: a.fileSize,
              })) ?? [],
          },
        },
        include: {
          sender: {
            select: {
              user_id: true,
              user_name: true,
              role: true,
              profile_picture: true,
            },
          },
          message_attachment: true,
          message_read: true,
        },
      });

      await tx.conversation.update({
        where: { conversation_id: conversationId },
        data: { last_message_at: now, updated_at: now },
      });

      await tx.message_read.upsert({
        where: {
          message_id_user_id: {
            message_id: created.message_id,
            user_id: userId,
          },
        },
        create: {
          message_id: created.message_id,
          user_id: userId,
          read_at: now,
        },
        update: { read_at: now },
      });

      return created;
    });

    await this.createChatNotifications(userId, conversationId, message);

    return this.mapMessage(message);
  }

  async markRead(userId: number, conversationId: number) {
    await this.verifyConversationAccess(userId, conversationId);
    const prisma = this.prisma as any;
    const messages = await prisma.message.findMany({
      where: { conversation_id: conversationId },
      select: { message_id: true },
    });
    const now = new Date();
    await prisma.$transaction(
      messages.map((m: any) =>
        prisma.message_read.upsert({
          where: {
            message_id_user_id: { message_id: m.message_id, user_id: userId },
          },
          create: { message_id: m.message_id, user_id: userId, read_at: now },
          update: { read_at: now },
        }),
      ),
    );
    return { readAt: now };
  }

  private validateMessage(dto: CreateMessageDto) {
    const body = dto.body?.trim();
    const attachments = dto.attachments ?? [];
    if (!body && attachments.length === 0) {
      throw new BadRequestException('Message body or attachment is required');
    }
    if (attachments.length > MAX_ATTACHMENTS) {
      throw new BadRequestException(
        `Maximum ${MAX_ATTACHMENTS} attachments per message`,
      );
    }
    for (const attachment of attachments) {
      if (attachment.fileSize > MAX_ATTACHMENT_SIZE) {
        throw new BadRequestException('Attachment exceeds 10MB limit');
      }
      if (!ALLOWED_MIME_TYPES.has(attachment.mimeType)) {
        throw new BadRequestException(
          `Unsupported attachment type: ${attachment.mimeType}`,
        );
      }
    }
  }

  private async verifyParentStudent(parentId: number, studentId: number) {
    const prisma = this.prisma as any;
    const link = await prisma.parent_student.findFirst({
      where: { parent_id: parentId, student_id: studentId, status: 'ACTIVE' },
    });
    if (!link)
      throw new ForbiddenException('Parent is not linked to this student');
  }

  private async verifyStudentInClass(studentId: number, classId: number) {
    const prisma = this.prisma as any;
    const classStudent = await prisma.class_student.findUnique({
      where: {
        class_id_student_id: { class_id: classId, student_id: studentId },
      },
    });
    if (!classStudent)
      throw new ForbiddenException('Student is not in this class');
  }

  private async verifyTeacherOwnsClass(teacherId: number, classId: number) {
    const prisma = this.prisma as any;
    const ownership = await prisma.teacher_classroom.findFirst({
      where: { teacher_id: teacherId, class_id: classId, is_owner: true },
    });
    if (!ownership) {
      throw new ForbiddenException('Teacher does not own this class');
    }
  }

  private async verifyConversationAccess(
    userId: number,
    conversationId: number,
  ) {
    const prisma = this.prisma as any;
    const conversation = await prisma.conversation.findUnique({
      where: { conversation_id: conversationId },
      include: { teacher_classroom: true },
    });
    if (!conversation) throw new NotFoundException('Conversation not found');

    if (
      conversation.conversation_type === 'PARENT_TEACHER' &&
      conversation.parent_id === userId
    ) {
      return conversation;
    }
    if (
      conversation.conversation_type === 'STUDENT_TEACHER' &&
      conversation.student_id === userId
    ) {
      return conversation;
    }
    if (
      conversation.teacher_id === userId &&
      conversation.teacher_classroom?.is_owner
    ) {
      return conversation;
    }

    throw new ForbiddenException('You do not have access to this conversation');
  }

  private async createChatNotifications(
    senderId: number,
    conversationId: number,
    message: any,
  ) {
    const prisma = this.prisma as any;
    const conversation = await prisma.conversation.findUnique({
      where: { conversation_id: conversationId },
      include: this.conversationInclude(),
    });
    if (!conversation) return;

    const recipientIds = this.getConversationRecipientIds(
      conversation,
      senderId,
    );
    if (recipientIds.length === 0) return;

    const senderName = message.sender?.user_name ?? 'Someone';
    const fallbackBody = message.message_attachment?.length
      ? 'Sent an attachment.'
      : 'Sent a new message.';
    const body = message.body?.trim() || fallbackBody;

    await Promise.all(
      recipientIds.map((recipientId) =>
        this.notificationService.create({
          userId: recipientId,
          title: `New message from ${senderName}`,
          body: body.length > 120 ? `${body.slice(0, 117)}...` : body,
          type: 'CHAT_MESSAGE',
          linkUrl:
            conversation.conversation_type === 'PARENT_TEACHER'
              ? '/parent'
              : conversation.student_id === recipientId
                ? '/student/classroom'
                : '/classroom',
          metadata: {
            conversationId: conversation.conversation_id,
            conversationType: conversation.conversation_type,
            classId: conversation.class_id,
            className: conversation.classroom?.class_name,
            studentId: conversation.student_id,
            studentName: conversation.student?.USER?.user_name,
            senderId,
          },
        }),
      ),
    );
  }

  private getConversationRecipientIds(conversation: any, senderId: number) {
    const recipients = new Set<number>();

    if (conversation.conversation_type === 'PARENT_TEACHER') {
      if (conversation.parent_id && conversation.parent_id !== senderId) {
        recipients.add(conversation.parent_id);
      }
      if (conversation.teacher_id !== senderId) {
        recipients.add(conversation.teacher_id);
      }
    }

    if (conversation.conversation_type === 'STUDENT_TEACHER') {
      if (conversation.student_id !== senderId) {
        recipients.add(conversation.student_id);
      }
      if (conversation.teacher_id !== senderId) {
        recipients.add(conversation.teacher_id);
      }
    }

    return Array.from(recipients);
  }

  private conversationInclude() {
    return {
      classroom: { include: { subject: true } },
      student: {
        include: {
          USER: {
            select: {
              user_id: true,
              user_name: true,
              email: true,
              profile_picture: true,
            },
          },
        },
      },
      parent: {
        include: {
          USER: {
            select: {
              user_id: true,
              user_name: true,
              email: true,
              profile_picture: true,
            },
          },
        },
      },
      teacher_classroom: {
        include: {
          USER: {
            select: {
              user_id: true,
              user_name: true,
              email: true,
              profile_picture: true,
            },
          },
        },
      },
      message: {
        orderBy: { message_id: 'desc' },
        take: 1,
        include: {
          sender: { select: { user_id: true, user_name: true, role: true } },
          message_attachment: true,
        },
      },
    };
  }

  private mapConversation(c: any, viewerId: number) {
    const last = c.message?.[0] ? this.mapMessage(c.message[0]) : null;
    return {
      conversationId: c.conversation_id,
      conversationType: c.conversation_type,
      classId: c.class_id,
      className: c.classroom?.class_name ?? '',
      subjectName: c.classroom?.subject?.subject_name ?? null,
      studentId: c.student_id,
      studentName: c.student?.USER?.user_name ?? '',
      parentId: c.parent_id,
      parentName: c.parent?.USER?.user_name ?? '',
      teacherId: c.teacher_id,
      teacherName: c.teacher_classroom?.USER?.user_name ?? '',
      createdAt: c.created_at,
      updatedAt: c.updated_at,
      lastMessageAt: c.last_message_at,
      lastMessage: last,
      viewerRole:
        c.conversation_type === 'PARENT_TEACHER' && c.parent_id === viewerId
          ? 'PARENT'
          : c.conversation_type === 'STUDENT_TEACHER' &&
              c.student_id === viewerId
            ? 'STUDENT'
            : 'TEACHER',
    };
  }

  private mapMessage(m: any) {
    return {
      messageId: m.message_id,
      conversationId: m.conversation_id,
      senderId: m.sender_id,
      senderName: m.sender?.user_name ?? '',
      senderRole: m.sender?.role ?? null,
      senderProfilePicture: m.sender?.profile_picture ?? null,
      body: m.body,
      createdAt: m.created_at,
      editedAt: m.edited_at,
      deletedAt: m.deleted_at,
      attachments:
        m.message_attachment?.map((a: any) => ({
          attachmentId: a.attachment_id,
          fileUrl: a.file_url,
          fileName: a.file_name,
          mimeType: a.mime_type,
          fileSize: a.file_size,
        })) ?? [],
      reads:
        m.message_read?.map((r: any) => ({
          userId: r.user_id,
          readAt: r.read_at,
        })) ?? [],
    };
  }
}
