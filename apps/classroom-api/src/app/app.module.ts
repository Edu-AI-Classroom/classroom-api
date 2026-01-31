import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import authConfig from '../config/auth/auth.config';
import healthConfig from '../config/health/health.config';
import { PrismaModule } from '../infrastructure/prisma/prisma.module';
import { AuthModule } from '../modules/auth/auth.module';
import { JwtAuthGuard } from '../modules/auth/guards/jwt-auth.guard';
import { HealthModule } from '../modules/health/health.module';
import { LessonsModule } from '../modules/lessons/lessons.module';
import { PaymentModule } from '../modules/payment/payment.module';
import { SubscriptionPlanModule } from '../modules/subscription-plan/subscription-plan.module';
import { UsersModule } from '../modules/users/users.module';

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
    PaymentModule,
  ],
  controllers: [],
})
export class AppModule {}
