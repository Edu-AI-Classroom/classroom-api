import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import authConfig from '../config/auth/auth.config';
import healthConfig from '../config/health/health.config';
import { PrismaModule } from '../infrastructure/prisma/prisma.module';
import { AuthModule } from '../modules/auth/auth.module';
import { JwtAuthGuard } from '../modules/auth/guards/jwt-auth.guard';
import { ClassroomModule } from '../modules/classroom/classroom.module';
import { HealthModule } from '../modules/health/health.module';
import { LessonsModule } from '../modules/lessons/lessons.module';
// import { PaymentModule } from '../modules/payment/payment.module';
import { SubscriptionPlanModule } from '../modules/subscription-plan/subscription-plan.module';
import { UsersModule } from '../modules/users/users.module';
import { NewsModule } from '../modules/new/news.module';
import { CommentsModule } from '../modules/comment/comments.module';
import { R2Module } from '../infrastructure/cloudflare_r2/r2.module';
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
      load: [healthConfig, authConfig],
    }),
    HealthModule,
    PrismaModule,
    AuthModule,
    LessonsModule,
    SubscriptionPlanModule,
    UsersModule,
    ClassroomModule,
    // PaymentModule,
    NewsModule,
    CommentsModule,
    R2Module,
  ],
  controllers: [],
})
export class AppModule {}
