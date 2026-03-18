import { Module } from '@nestjs/common';
import { PrismaModule } from '../../infrastructure/prisma/prisma.module';
import { SubscriptionPlanModule } from '../subscription-plan/subscription-plan.module';
import { AdminSubscriptionPlanController } from './admin-subscription-plan.controller';
import { AdminTransactionController } from './admin-transaction.controller';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';

@Module({
  imports: [PrismaModule, SubscriptionPlanModule],
  controllers: [
    AdminController,
    AdminTransactionController,
    AdminSubscriptionPlanController,
  ],
  providers: [AdminService],
  exports: [AdminService],
})
export class AdminModule {}
