import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import authConfig from '../config/auth/auth.config';
import healthConfig from '../config/health/health.config';
import { PrismaModule } from '../infrastructure/prisma/prisma.module';
import { AuthModule } from '../modules/auth/auth.module';
import { HealthModule } from '../modules/health/health.module';
import { LessonsModule } from '../modules/lessons/lessons.module';
import { SubscriptionPlanModule } from '../modules/subscription-plan/subscription-plan.module';
import { UsersModule } from '../modules/users/users.module';

@Module({
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
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
