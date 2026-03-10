import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { ClassroomController } from './classroom.controller';
import { ClassroomService } from './classroom.service';

@Module({
  imports: [TerminusModule, HttpModule],
  controllers: [ClassroomController],
  providers: [ClassroomService],
})
export class ClassroomModule {}
