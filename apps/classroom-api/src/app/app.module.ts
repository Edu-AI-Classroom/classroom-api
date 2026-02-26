import { SubscriptionPlanModule } from '@/modules/subscription-plan/subscription-plan.module';
import { UsersModule } from '@/modules/users/users.module';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import authConfig from '../config/auth/auth.config';
import healthConfig from '../config/health/health.config';
import { AppLoggerModule } from '../infrastructure/logger';
import { PrismaModule } from '../infrastructure/prisma/prisma.module';
import { AuthModule } from '../modules/auth/auth.module';
import { HealthModule } from '../modules/health/health.module';
import { TransactionModule } from '../modules/transaction/transaction.module';

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
    AppLoggerModule,
    AuthModule,
    TransactionModule,
    UsersModule,
    SubscriptionPlanModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
