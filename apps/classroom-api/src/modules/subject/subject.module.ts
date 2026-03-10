import { Module } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { SubjectController } from './subject.controller';
import { SubjectService } from './subject.service';

@Module({
  controllers: [SubjectController],
  providers: [SubjectService, PrismaService],
})
export class SubjectModule {}
