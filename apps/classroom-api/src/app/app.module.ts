import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import healthConfig from '../config/health/health.config';
import { PrismaModule } from '../infrastructure/prisma/prisma.module';
import { HealthModule } from '../modules/health/health.module';

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
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
