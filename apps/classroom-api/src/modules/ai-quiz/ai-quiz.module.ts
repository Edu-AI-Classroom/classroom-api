import { Module } from '@nestjs/common';
import { PrismaModule } from '../../infrastructure/prisma/prisma.module';
import { AiQuizController } from './ai-quiz.controller';
import { AiQuizService } from './ai-quiz.service';

@Module({
  imports: [PrismaModule],
  controllers: [AiQuizController],
  providers: [AiQuizService],
})
export class AiQuizModule {}

