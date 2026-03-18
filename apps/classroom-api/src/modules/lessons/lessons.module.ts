import { Module } from '@nestjs/common';
import { PrismaModule } from '../../infrastructure/prisma/prisma.module';
import { LessonsController } from './lessons.controller';
import { LessonsService } from './lessons.service';
import { R2Module } from '../../infrastructure/cloudflare_r2/r2.module';

@Module({
  imports: [PrismaModule, R2Module],
  controllers: [LessonsController],
  providers: [LessonsService],
})
export class LessonsModule {}
