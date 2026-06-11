import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';

@Injectable()
export class NotificationService {
  constructor(private readonly prisma: PrismaService) {}

  async create(input: {
    userId: number;
    title: string;
    body?: string | null;
    type: string;
    linkUrl?: string | null;
    metadata?: Record<string, unknown> | null;
  }) {
    const prisma = this.prisma as any;
    const notification = await prisma.notification.create({
      data: {
        user_id: input.userId,
        title: input.title,
        body: input.body ?? null,
        type: input.type,
        link_url: input.linkUrl ?? null,
        metadata: input.metadata ?? undefined,
      },
    });
    return this.mapNotification(notification);
  }

  async list(userId: number, limit = 20) {
    const prisma = this.prisma as any;
    const take = Math.min(Math.max(Number(limit) || 20, 1), 50);
    const notifications = await prisma.notification.findMany({
      where: { user_id: userId },
      orderBy: { created_at: 'desc' },
      take,
    });

    return notifications.map((notification: any) =>
      this.mapNotification(notification),
    );
  }

  async unreadCount(userId: number) {
    const prisma = this.prisma as any;
    const count = await prisma.notification.count({
      where: { user_id: userId, read_at: null },
    });
    return { count };
  }

  async markRead(userId: number, notificationId: number) {
    const prisma = this.prisma as any;
    const notification = await prisma.notification.findFirst({
      where: { notification_id: notificationId, user_id: userId },
    });
    if (!notification) throw new NotFoundException('Notification not found');

    const updated = await prisma.notification.update({
      where: { notification_id: notificationId },
      data: { read_at: notification.read_at ?? new Date() },
    });
    return this.mapNotification(updated);
  }

  async markAllRead(userId: number) {
    const prisma = this.prisma as any;
    await prisma.notification.updateMany({
      where: { user_id: userId, read_at: null },
      data: { read_at: new Date() },
    });
    return { success: true };
  }

  private mapNotification(notification: any) {
    return {
      notificationId: notification.notification_id,
      userId: notification.user_id,
      title: notification.title,
      body: notification.body,
      type: notification.type,
      linkUrl: notification.link_url,
      metadata: notification.metadata,
      readAt: notification.read_at,
      createdAt: notification.created_at,
    };
  }
}
