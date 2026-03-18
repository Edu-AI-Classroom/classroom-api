import { Module } from '@nestjs/common';
import { R2Module } from '../../infrastructure/cloudflare_r2/r2.module';
import { PrismaModule } from '../../infrastructure/prisma/prisma.module';
import { QdrantModule } from '../../infrastructure/qdrant/qdrant.module';
import { AiQuizController } from './ai-quiz.controller';
import { AiQuizService } from './ai-quiz.service';
import { DocumentParserService } from './services/document-parser.service';
import { TextEmbedderService } from './services/text-embedder.service';

@Module({
  imports: [PrismaModule, R2Module, QdrantModule],
  controllers: [AiQuizController],
  providers: [AiQuizService, DocumentParserService, TextEmbedderService],
})
export class AiQuizModule {}
