import { Module } from '@nestjs/common';
import { PrismaModule } from '../../infrastructure/prisma/prisma.module';
import { ChatModule } from '../chat/chat.module';
import { ParentController } from './parent.controller';
import { ParentService } from './parent.service';
import { StudentParentLinkController } from './student-parent-link.controller';
import { StudentParentLinkService } from './student-parent-link.service';

@Module({
  imports: [PrismaModule, ChatModule],
  controllers: [ParentController, StudentParentLinkController],
  providers: [ParentService, StudentParentLinkService],
  exports: [ParentService],
})
export class ParentModule {}
