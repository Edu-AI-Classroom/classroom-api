import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '../../infrastructure/prisma/prisma.module';
import { PayOSService } from './payos.service';
import { PayOSWebhookValidationPipe } from './pipes';
import { TransactionController } from './transaction.controller';
import { TransactionService } from './transaction.service';

@Module({
  imports: [ConfigModule, PrismaModule],
  controllers: [TransactionController],
  providers: [TransactionService, PayOSService, PayOSWebhookValidationPipe],
  exports: [TransactionService, PayOSService],
})
export class TransactionModule {}
