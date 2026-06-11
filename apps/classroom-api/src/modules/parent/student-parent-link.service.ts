import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomBytes } from 'node:crypto';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';

const LINK_CODE_TTL_DAYS = 7;

@Injectable()
export class StudentParentLinkService {
  constructor(private readonly prisma: PrismaService) {}

  async createLinkCode(studentId: number) {
    const prisma = this.prisma as any;
    await this.verifyStudentProfile(studentId);

    await prisma.parent_link_code.updateMany({
      where: {
        student_id: studentId,
        used_at: null,
        is_revoked: false,
        expires_at: { gt: new Date() },
      },
      data: { is_revoked: true },
    });

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + LINK_CODE_TTL_DAYS);

    const code = await this.generateUniqueCode();
    return prisma.parent_link_code.create({
      data: {
        code,
        student_id: studentId,
        created_by_student_id: studentId,
        expires_at: expiresAt,
      },
    });
  }

  async getActiveLinkCode(studentId: number) {
    await this.verifyStudentProfile(studentId);
    const prisma = this.prisma as any;
    return prisma.parent_link_code.findFirst({
      where: {
        student_id: studentId,
        used_at: null,
        is_revoked: false,
        expires_at: { gt: new Date() },
      },
      orderBy: { created_at: 'desc' },
    });
  }

  async revokeLinkCode(studentId: number, code: string) {
    await this.verifyStudentProfile(studentId);
    const prisma = this.prisma as any;
    const linkCode = await prisma.parent_link_code.findUnique({
      where: { code: code.trim().toUpperCase() },
    });
    if (!linkCode) throw new NotFoundException('Link code not found');
    if (linkCode.student_id !== studentId) {
      throw new ForbiddenException('Cannot revoke another student link code');
    }
    if (linkCode.used_at)
      throw new BadRequestException('Cannot revoke a used link code');
    await prisma.parent_link_code.update({
      where: { code: linkCode.code },
      data: { is_revoked: true },
    });
  }

  private async verifyStudentProfile(studentId: number) {
    const prisma = this.prisma as any;
    const student = await prisma.student.findUnique({
      where: { student_id: studentId },
    });
    if (!student)
      throw new ForbiddenException(
        'Only students can create parent link codes',
      );
  }

  private async generateUniqueCode() {
    const prisma = this.prisma as any;
    for (let i = 0; i < 10; i += 1) {
      const code = randomBytes(4).toString('hex').toUpperCase();
      const existing = await prisma.parent_link_code.findUnique({
        where: { code },
      });
      if (!existing) return code;
    }
    throw new BadRequestException('Could not generate a unique link code');
  }
}
