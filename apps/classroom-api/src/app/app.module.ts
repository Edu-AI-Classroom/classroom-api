import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import healthConfig from '../config/health/health.config';
import { PrismaModule } from '../infrastructure/prisma/prisma.module';
import { HealthModule } from '../modules/health/health.module';
import { LessonsModule } from '../modules/lessons/lessons.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      cache: true,
      load: [healthConfig],
    }),
    HealthModule,
    PrismaModule,
    LessonsModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
