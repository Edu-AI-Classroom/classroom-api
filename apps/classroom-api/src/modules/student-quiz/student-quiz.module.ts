import { Module } from '@nestjs/common';
import { PrismaModule } from '../../infrastructure/prisma/prisma.module';
import { StudentQuizController } from './student-quiz.controller';
import { StudentQuizService } from './student-quiz.service';

@Module({
  imports: [PrismaModule],
  controllers: [StudentQuizController],
  providers: [StudentQuizService],
})
export class StudentQuizModule {}
