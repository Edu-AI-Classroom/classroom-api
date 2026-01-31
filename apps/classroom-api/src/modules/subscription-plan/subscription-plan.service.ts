import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { CreateSubscriptionPlanDto } from './dtos/create-subscription-plan.dto';
import { UpdateSubscriptionPlanDto } from './dtos/update-subscription-plan.dto';

@Injectable()
export class SubscriptionPlanService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateSubscriptionPlanDto) {
    const prisma = this.prisma as any;

    const existing = await prisma.subscription_plan.findUnique({
      where: { code: dto.code },
    });
    if (existing) {
      throw new ConflictException(`Mã plan "${dto.code}" đã tồn tại`);
    }

    const plan = await prisma.subscription_plan.create({
      data: {
        code: dto.code,
        name: dto.name,
        price: dto.price,
        duration_days: dto.duration_days,
        ai_token_limit: dto.ai_token_limit,
        ai_request_limit: dto.ai_request_limit ?? null,
        max_classes: dto.max_classes ?? null,
        max_exams_per_month: dto.max_exams_per_month ?? null,
        max_lessons_ai: dto.max_lessons_ai ?? null,
        is_active: dto.is_active ?? true,
      },
    });

    return {
      message: 'Tạo gói subscription thành công',
      data: this.mapToResponse(plan),
    };
  }

  async findAll(activeOnly?: boolean) {
    const prisma = this.prisma as any;

    const where = activeOnly ? { is_active: true } : {};
    const plans = await prisma.subscription_plan.findMany({
      where,
      orderBy: { price: 'asc' },
    });

    return plans.map((p) => this.mapToResponse(p));
  }

  async findOne(id: number) {
    const prisma = this.prisma as any;

    const plan = await prisma.subscription_plan.findUnique({
      where: { plan_id: id },
    });
    if (!plan) {
      throw new NotFoundException('Gói subscription không tồn tại');
    }
    return this.mapToResponse(plan);
  }

  async findByCode(code: string) {
    const prisma = this.prisma as any;

    const plan = await prisma.subscription_plan.findUnique({
      where: { code },
    });
    if (!plan) {
      throw new NotFoundException('Gói subscription không tồn tại');
    }
    return this.mapToResponse(plan);
  }

  async update(id: number, dto: UpdateSubscriptionPlanDto) {
    const prisma = this.prisma as any;

    const existing = await prisma.subscription_plan.findUnique({
      where: { plan_id: id },
    });
    if (!existing) {
      throw new NotFoundException('Gói subscription không tồn tại');
    }

    if (dto.code && dto.code !== existing.code) {
      const duplicate = await prisma.subscription_plan.findUnique({
        where: { code: dto.code },
      });
      if (duplicate) {
        throw new ConflictException(`Mã plan "${dto.code}" đã tồn tại`);
      }
    }

    const plan = await prisma.subscription_plan.update({
      where: { plan_id: id },
      data: {
        code: dto.code ?? existing.code,
        name: dto.name ?? existing.name,
        price: dto.price ?? existing.price,
        duration_days: dto.duration_days ?? existing.duration_days,
        ai_token_limit: dto.ai_token_limit ?? existing.ai_token_limit,
        ai_request_limit: dto.ai_request_limit ?? existing.ai_request_limit,
        max_classes: dto.max_classes ?? existing.max_classes,
        max_exams_per_month:
          dto.max_exams_per_month ?? existing.max_exams_per_month,
        max_lessons_ai: dto.max_lessons_ai ?? existing.max_lessons_ai,
        is_active: dto.is_active ?? existing.is_active,
      },
    });

    return {
      message: 'Cập nhật gói subscription thành công',
      data: this.mapToResponse(plan),
    };
  }

  async remove(id: number) {
    const prisma = this.prisma as any;

    const existing = await prisma.subscription_plan.findUnique({
      where: { plan_id: id },
    });
    if (!existing) {
      throw new NotFoundException('Gói subscription không tồn tại');
    }

    await prisma.subscription_plan.delete({
      where: { plan_id: id },
    });

    return { message: 'Xóa gói subscription thành công' };
  }

  private mapToResponse(plan: any) {
    return {
      planId: plan.plan_id,
      code: plan.code,
      name: plan.name,
      price: Number(plan.price),
      durationDays: plan.duration_days,
      aiTokenLimit: plan.ai_token_limit,
      aiRequestLimit: plan.ai_request_limit,
      maxClasses: plan.max_classes,
      maxExamsPerMonth: plan.max_exams_per_month,
      maxLessonsAi: plan.max_lessons_ai,
      isActive: plan.is_active,
      createdAt: plan.created_at,
    };
  }
}
