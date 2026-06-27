import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { CreateUserDto } from './dtos/create-user.dto';
import { UpdateUserDto } from './dtos/update-user.dto';

const SALT_ROUNDS = 10;

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateUserDto) {
    const prisma = this.prisma as any;

    const existing = await prisma.USER.findUnique({
      where: { email: dto.email },
    });
    if (existing) {
      throw new ConflictException('Email Ä‘Ã£ Ä‘Æ°á»£c sá»­ dá»¥ng');
    }

    const password_hash = await bcrypt.hash(dto.password, SALT_ROUNDS);

    const user = await prisma.uSER.create({
      data: {
        user_name: dto.user_name,
        email: dto.email,
        password_hash,
        role: dto.role ?? null,
        profile_picture: dto.profile_picture ?? null,
        is_active: dto.is_active ?? true,
        credit: dto.credit ?? 0,
      },
    });

    return {
      message: 'Táº¡o user thÃ nh cÃ´ng',
      data: this.mapToUserResponse(user),
    };
  }

  async findAll() {
    const prisma = this.prisma as any;
    const users = await prisma.uSER.findMany({
      orderBy: { created_at: 'desc' },
    });
    return users.map((u) => this.mapToUserResponse(u));
  }

  async findOne(id: number) {
    const prisma = this.prisma as any;
    const user = await prisma.USER.findUnique({
      where: { user_id: id },
    });
    if (!user) {
      throw new NotFoundException('User khÃ´ng tá»“n táº¡i');
    }
    return this.mapToUserResponse(user);
  }

  async findByEmail(email: string) {
    const prisma = this.prisma as any;
    const user = await prisma.USER.findUnique({
      where: { email },
    });
    if (!user) {
      throw new NotFoundException('User khÃ´ng tá»“n táº¡i');
    }
    return this.mapToUserResponse(user);
  }

  async update(id: number, dto: UpdateUserDto) {
    const prisma = this.prisma as any;

    const existing = await prisma.USER.findUnique({
      where: { user_id: id },
    });
    if (!existing) {
      throw new NotFoundException('User khÃ´ng tá»“n táº¡i');
    }

    if (dto.email && dto.email !== existing.email) {
      const duplicate = await prisma.uSER.findUnique({
        where: { email: dto.email },
      });
      if (duplicate) {
        throw new ConflictException('Email Ä‘Ã£ Ä‘Æ°á»£c sá»­ dá»¥ng');
      }
    }

    const data: Record<string, unknown> = {};
    if (dto.user_name != null) data.user_name = dto.user_name;
    if (dto.email != null) data.email = dto.email;
    if (dto.role != null) data.role = dto.role;
    if (dto.profile_picture != null) data.profile_picture = dto.profile_picture;
    if (dto.is_active != null) data.is_active = dto.is_active;
    if (dto.credit != null) data.credit = dto.credit;
    if (dto.password) {
      data.password_hash = await bcrypt.hash(dto.password, SALT_ROUNDS);
    }
    data.updated_at = new Date();

    const user = await prisma.uSER.update({
      where: { user_id: id },
      data,
    });

    return {
      message: 'Cáº­p nháº­t user thÃ nh cÃ´ng',
      data: this.mapToUserResponse(user),
    };
  }

  async remove(id: number) {
    const prisma = this.prisma as any;

    const existing = await prisma.uSER.findUnique({
      where: { user_id: id },
    });
    if (!existing) {
      throw new NotFoundException('User khÃ´ng tá»“n táº¡i');
    }

    await prisma.uSER.delete({
      where: { user_id: id },
    });

    return { message: 'XÃ³a user thÃ nh cÃ´ng' };
  }

  async getCurrentSubscription(userId: number) {
    const prisma = this.prisma as any;
    const personalInfo = await prisma.personal_info.findUnique({
      where: { user_id: userId },
      include: {
        subscription_plan: true,
      },
    });

    if (!personalInfo || !personalInfo.sub_id) {
      return null;
    }

    const subscriptionPlan = personalInfo.subscription_plan;
    const startDate = personalInfo.sub_start_date;

    if (
      !subscriptionPlan ||
      !startDate ||
      personalInfo.sub_status !== 'ACTIVE'
    ) {
      return null;
    }

    const durationDays = subscriptionPlan.duration_days || 30;
    const expiryDate = new Date(startDate);
    expiryDate.setDate(expiryDate.getDate() + durationDays);

    const now = new Date();
    const timeDifference = expiryDate.getTime() - now.getTime();
    const daysRemaining = Math.ceil(timeDifference / (1000 * 3600 * 24));
    const isExpired = now > expiryDate;

    if (isExpired) {
      return {
        status: 'EXPIRED',
        subscriptionName: subscriptionPlan.sub_name,
        subscriptionCode: subscriptionPlan.sub_code,
        startDate,
        expiryDate,
        daysRemaining: 0,
        subscriptionStatus: 'EXPIRED',
        aiTokenLimit: subscriptionPlan.ai_token_limit,
        aiTokensRemaining: 0,
        maxClasses: subscriptionPlan.max_classes ?? null,
        usedClasses: 0,
        remainingClasses: 0,
      };
    }

    const [user, usedClasses] = await Promise.all([
      prisma.uSER.findUnique({
        where: { user_id: userId },
        select: { credit: true },
      }),
      prisma.teacher_classroom.count({
        where: { teacher_id: userId, is_owner: true },
      }),
    ]);

    const maxClasses = subscriptionPlan.max_classes ?? null;
    const remainingClasses =
      maxClasses == null ? null : Math.max(maxClasses - usedClasses, 0);

    return {
      status: 'ACTIVE',
      subscriptionName: subscriptionPlan.sub_name,
      subscriptionCode: subscriptionPlan.sub_code,
      startDate,
      expiryDate,
      daysRemaining,
      subscriptionStatus: 'ACTIVE',
      aiTokenLimit: subscriptionPlan.ai_token_limit,
      aiTokensRemaining: user?.credit ?? 0,
      maxClasses,
      usedClasses,
      remainingClasses,
    };
  }

  private mapToUserResponse(user: any) {
    return {
      userId: user.user_id,
      userName: user.user_name,
      email: user.email,
      role: user.role,
      profilePicture: user.profile_picture,
      isActive: user.is_active,
      credit: user.credit,
      createdAt: user.created_at,
      updatedAt: user.updated_at,
    };
  }
}
