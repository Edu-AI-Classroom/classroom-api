import { Module } from '@nestjs/common';
import { PrismaModule } from '../../infrastructure/prisma/prisma.module';
import { SiteFeedbackController } from './site-feedback.controller';
import { SiteFeedbackService } from './site-feedback.service';

@Module({
  imports: [PrismaModule],
  controllers: [SiteFeedbackController],
  providers: [SiteFeedbackService],
  exports: [SiteFeedbackService],
})
export class SiteFeedbackModule {}
