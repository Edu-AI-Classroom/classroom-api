import { Module } from '@nestjs/common';
import { ClassroomModule } from '../classroom/classroom.module';
import { PrismaModule } from '../../infrastructure/prisma/prisma.module';
import { AgoraController } from './agora.controller';
import { AgoraService } from './agora.service';

@Module({
  imports: [ClassroomModule, PrismaModule],
  controllers: [AgoraController],
  providers: [AgoraService],
})
export class AgoraModule {}
