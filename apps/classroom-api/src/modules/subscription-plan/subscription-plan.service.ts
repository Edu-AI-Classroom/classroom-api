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
    // 1. Kiểm tra trùng mã sub_code
    const existing = await this.prisma.subscription_plan.findUnique({
      where: { sub_code: dto.sub_code },
    });
    if (existing) {
      throw new ConflictException(`Mã plan "${dto.sub_code}" đã tồn tại`);
    }

    // 2. Tạo record (Prisma tự động loại bỏ fields undefined nếu để đúng cấu trúc)
    const plan = await this.prisma.subscription_plan.create({
      data: {
        ...dto,
        is_active: dto.is_active ?? true,
      },
    });

    return {
      message: 'Tạo gói subscription thành công',
      data: this.mapToResponse(plan),
    };
  }

  async findAll(activeOnly?: boolean) {
    const where = activeOnly ? { is_active: true } : {};
    const plans = await this.prisma.subscription_plan.findMany({
      where,
      orderBy: { price: 'asc' },
    });

    return plans.map((p) => this.mapToResponse(p));
  }

  async findOne(id: number) {
    const plan = await this.prisma.subscription_plan.findUnique({
      where: { sub_id: id },
    });
    if (!plan) {
      throw new NotFoundException('Gói subscription không tồn tại');
    }
    return this.mapToResponse(plan);
  }

  async findByCode(sub_code: string) {
    const plan = await this.prisma.subscription_plan.findUnique({
      where: { sub_code },
    });
    if (!plan) {
      throw new NotFoundException('Gói subscription không tồn tại');
    }
    return this.mapToResponse(plan);
  }

  async update(id: number, dto: UpdateSubscriptionPlanDto) {
    const existing = await this.prisma.subscription_plan.findUnique({
      where: { sub_id: id },
    });
    if (!existing) {
      throw new NotFoundException('Gói subscription không tồn tại');
    }

    // Kiểm tra nếu đổi sub_code thì có trùng với ai khác không
    if (dto.sub_code && dto.sub_code !== existing.sub_code) {
      const duplicate = await this.prisma.subscription_plan.findUnique({
        where: { sub_code: dto.sub_code },
      });
      if (duplicate) {
        throw new ConflictException(`Mã plan "${dto.sub_code}" đã tồn tại`);
      }
    }

    const plan = await this.prisma.subscription_plan.update({
      where: { sub_id: id },
      data: dto,
    });

    return {
      message: 'Cập nhật gói subscription thành công',
      data: this.mapToResponse(plan),
    };
  }

  async remove(id: number) {
    const existing = await this.prisma.subscription_plan.findUnique({
      where: { sub_id: id },
    });
    if (!existing) {
      throw new NotFoundException('Gói subscription không tồn tại');
    }

    await this.prisma.subscription_plan.delete({
      where: { sub_id: id },
    });

    return { message: 'Xóa gói subscription thành công' };
  }

  private mapToResponse(plan: any) {
    return {
      subId: plan.sub_id,
      subCode: plan.sub_code,
      subName: plan.sub_name,
      price: Number(plan.price), // Chuyển Decimal sang Number
      durationDays: plan.duration_days,
      aiTokenLimit: plan.ai_token_limit,
      aiRequestLimit: plan.ai_request_limit,
      maxClasses: plan.max_classes,
      maxDocuments: plan.max_documents,
      isActive: plan.is_active,
    };
  }
}
