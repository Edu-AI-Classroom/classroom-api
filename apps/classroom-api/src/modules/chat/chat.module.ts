import { Module } from '@nestjs/common';
import { R2Module } from '../../infrastructure/cloudflare_r2/r2.module';
import { PrismaModule } from '../../infrastructure/prisma/prisma.module';
import { NotificationModule } from '../notification/notification.module';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';

@Module({
  imports: [PrismaModule, R2Module, NotificationModule],
  controllers: [ChatController],
  providers: [ChatService],
  exports: [ChatService],
})
export class ChatModule {}
