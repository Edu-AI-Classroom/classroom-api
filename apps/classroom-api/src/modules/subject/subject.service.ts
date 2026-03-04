import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';

@Injectable()
export class SubjectService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.subject.findMany({
      orderBy: { subject_name: 'asc' },
    });
  }
}
