import { Module } from '@nestjs/common';
import { PrismaModule } from '../../infrastructure/prisma/prisma.module';
import {
  TeacherQuestionController,
  TeacherQuizController,
} from './teacher-quiz.controller';
import { TeacherQuizService } from './teacher-quiz.service';

@Module({
  imports: [PrismaModule],
  controllers: [TeacherQuizController, TeacherQuestionController],
  providers: [TeacherQuizService],
})
export class TeacherQuizModule {}
