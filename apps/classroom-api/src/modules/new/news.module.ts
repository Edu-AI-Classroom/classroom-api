import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { R2Module } from '../../infrastructure/cloudflare_r2/r2.module';
import { PrismaModule } from '../../infrastructure/prisma/prisma.module';
import { NewsController } from './news.controller';
import { NewsService } from './news.service';
import multer from 'multer';
@Module({
  imports: [
    PrismaModule,
    R2Module,
    MulterModule.register({
      storage: multer.memoryStorage(),
    }),
  ],
  controllers: [NewsController],
  providers: [NewsService],
  exports: [NewsService],
})
export class NewsModule {}
