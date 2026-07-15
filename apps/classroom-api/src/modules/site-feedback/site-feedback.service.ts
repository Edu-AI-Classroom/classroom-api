import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { CreateSiteFeedbackDto } from './dtos/create-site-feedback.dto';

@Injectable()
export class SiteFeedbackService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateSiteFeedbackDto) {
    const feedback = await this.prisma.site_feedback.create({
      data: {
        name: dto.name.trim(),
        email: dto.email?.trim().toLowerCase(),
        role: dto.role?.trim().toUpperCase(),
        rating: dto.rating,
        comment: dto.comment.trim(),
        is_approved: true,
      },
    });

    return this.mapFeedback(feedback);
  }

  async getPublicTestimonials(limit = 6) {
    const safeLimit = Math.min(Math.max(Number(limit) || 6, 1), 12);
    const rows = await this.prisma.site_feedback.findMany({
      where: { is_approved: true },
      orderBy: { created_at: 'desc' },
      take: safeLimit,
    });

    return rows.map((row) => this.mapFeedback(row));
  }

  private mapFeedback(row: any) {
    return {
      id: row.feedback_id,
      name: row.name,
      email: row.email,
      role: row.role,
      rating: row.rating,
      comment: row.comment,
      isApproved: row.is_approved,
      createdAt: row.created_at?.toISOString() ?? new Date().toISOString(),
    };
  }
}
