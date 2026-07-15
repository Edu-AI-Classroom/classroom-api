import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import agoraConfig from '../config/agora/agora.config';
import authConfig from '../config/auth/auth.config';
import healthConfig from '../config/health/health.config';
import { AppLoggerModule } from '../infrastructure/logger';
import { PrismaModule } from '../infrastructure/prisma/prisma.module';
import { AuthModule } from '../modules/auth/auth.module';
import { JwtAuthGuard } from '../modules/auth/guards/jwt-auth.guard';
import { ClassroomModule } from '../modules/classroom/classroom.module';
import { ChatModule } from '../modules/chat/chat.module';
import { HealthModule } from '../modules/health/health.module';
import { LessonsModule } from '../modules/lessons/lessons.module';
// import { PaymentModule } from '../modules/payment/payment.module';
// import { AssignmentModule } from '@/modules/assignment/assignment.module';
import { R2Module } from '../infrastructure/cloudflare_r2/r2.module';
import { AdminModule } from '../modules/admin/admin.module';
import { AdminDashboardModule } from '../modules/admin-dashboard/admin-dashboard.module';
import { AgoraModule } from '../modules/agora/agora.module';
import { AiQuizModule } from '../modules/ai-quiz/ai-quiz.module';
import { CommentsModule } from '../modules/comment/comments.module';
import { NewsModule } from '../modules/new/news.module';
import { NotificationModule } from '../modules/notification/notification.module';
import { ParentModule } from '../modules/parent/parent.module';
import { StudentQuizModule } from '../modules/student-quiz/student-quiz.module';
import { SubjectModule } from '../modules/subject/subject.module';
import { SubscriptionPlanModule } from '../modules/subscription-plan/subscription-plan.module';
import { TeacherQuizModule } from '../modules/teacher-quiz/teacher-quiz.module';
import { TransactionModule } from '../modules/transaction/transaction.module';
import { UsersModule } from '../modules/users/users.module';
import { SiteFeedbackModule } from '../modules/site-feedback/site-feedback.module';
@Module({
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      cache: true,
      load: [healthConfig, authConfig, agoraConfig],
    }),
    HealthModule,
    AppLoggerModule,
    PrismaModule,
    AuthModule,
    LessonsModule,
    SubscriptionPlanModule,
    UsersModule,
    TransactionModule,
    AdminDashboardModule,
    AdminModule,
    ClassroomModule,
    // PaymentModule,
    NewsModule,
    CommentsModule,
    R2Module,
    // AssignmentModule,
    SubjectModule,
    TeacherQuizModule,
    StudentQuizModule,
    AiQuizModule,
    ChatModule,
    ParentModule,
    NotificationModule,
    SiteFeedbackModule,
    AgoraModule,
  ],
  controllers: [],
})
export class AppModule {}
