import {
  Body,
  Controller,
  Param,
  ParseUUIDPipe,
  Post,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/public.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { GenerateQuizWithAiDto } from './dtos/generate-quiz-with-ai.dto';
import { IngestDocumentDto } from './dtos/ingest-document.dto';
import { RagGenerateDto } from './dtos/rag-generate.dto';
import { ReviewGeneratedContentDto } from './dtos/review-generated-content.dto';
import { AiQuizService } from './ai-quiz.service';

@ApiTags('AI Quiz')
@Controller('teacher/quizzes')
@ApiBearerAuth('JWT-auth')
@UseGuards(RolesGuard)
export class AiQuizController {
  constructor(private readonly aiQuiz: AiQuizService) {}

  @Post(':quizId/ai-generate')
  @Roles('TEACHER')
  @ApiOperation({ summary: 'Generate quiz questions with Gemini AI' })
  @ApiResponse({ status: 200, description: 'AI-generated questions' })
  generate(
    @CurrentUser('userId') userId: number,
    @Param('quizId') quizId: string,
    @Body() dto: GenerateQuizWithAiDto,
  ) {
    return this.aiQuiz.generateForQuiz(userId, quizId, dto);
  }

  @Post(':quizId/ai-generate/stream')
  @Roles('TEACHER')
  @ApiOperation({ summary: 'Stream quiz generation tokens in real time (SSE)' })
  @ApiResponse({ status: 200, description: 'Token stream + final payload' })
  async generateStream(
    @CurrentUser('userId') userId: number,
    @Param('quizId') quizId: string,
    @Body() dto: GenerateQuizWithAiDto,
    @Res() res: any,
  ) {
    this.setupSse(res);
    try {
      const result = await this.aiQuiz.generateForQuizStream(
        userId,
        quizId,
        dto,
        (token) => this.writeSse(res, 'token', { token }),
      );
      this.writeSse(res, 'done', result);
    } catch (error: any) {
      this.writeSse(res, 'error', {
        message: error?.message ?? 'Streaming generation failed',
      });
    } finally {
      res.end();
    }
  }

  @Post('rag/documents/upload')
  @Roles('TEACHER')
  @ApiOperation({
    summary: 'Upload document to R2, chunk, embed, and index in Qdrant',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        title: { type: 'string' },
        documentType: {
          type: 'string',
          enum: ['LESSON', 'ASSIGNMENT', 'EXAM'],
        },
        gradeLevel: { type: 'number' },
        subjectId: { type: 'number' },
        classId: { type: 'number' },
        tags: { type: 'array', items: { type: 'string' } },
        note: { type: 'string' },
        file: { type: 'string', format: 'binary' },
      },
      required: ['title', 'gradeLevel', 'subjectId', 'file'],
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  ingestDocument(
    @CurrentUser('userId') userId: number,
    @Body() dto: IngestDocumentDto,
    @UploadedFile() file: any,
  ) {
    return this.aiQuiz.ingestDocument(userId, dto, file);
  }

  @Post('rag/documents/:documentId/generate')
  @Roles('TEACHER')
  @ApiOperation({
    summary: 'Retrieve relevant chunks from Qdrant and generate AI response',
  })
  generateWithRag(
    @CurrentUser('userId') userId: number,
    @Param('documentId', ParseUUIDPipe) documentId: string,
    @Body() dto: RagGenerateDto,
  ) {
    return this.aiQuiz.generateWithRag(userId, documentId, dto);
  }

  @Post('rag/documents/:documentId/generate/stream')
  @Roles('TEACHER')
  @ApiOperation({ summary: 'Stream RAG generation tokens in real time (SSE)' })
  @ApiResponse({ status: 200, description: 'Token stream + final payload' })
  async generateWithRagStream(
    @CurrentUser('userId') userId: number,
    @Param('documentId', ParseUUIDPipe) documentId: string,
    @Body() dto: RagGenerateDto,
    @Res() res: any,
  ) {
    this.setupSse(res);
    try {
      const result = await this.aiQuiz.generateWithRagStream(
        userId,
        documentId,
        dto,
        (token) => this.writeSse(res, 'token', { token }),
      );
      this.writeSse(res, 'done', result);
    } catch (error: any) {
      this.writeSse(res, 'error', {
        message: error?.message ?? 'Streaming RAG generation failed',
      });
    } finally {
      res.end();
    }
  }

  @Post('rag/reviews')
  @Roles('TEACHER')
  @ApiOperation({
    summary: 'Review generated content and insert to content bank',
  })
  reviewGenerated(
    @CurrentUser('userId') userId: number,
    @Body() dto: ReviewGeneratedContentDto,
  ) {
    return this.aiQuiz.reviewGeneratedContent(userId, dto);
  }

  private setupSse(res: any) {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    if (typeof res.flushHeaders === 'function') {
      res.flushHeaders();
    }
  }

  private writeSse(res: any, event: string, payload: unknown) {
    res.write(`event: ${event}\n`);
    res.write(`data: ${JSON.stringify(payload)}\n\n`);
  }
}
