import { GoogleGenerativeAI } from '@google/generative-ai';
import {
  BadRequestException,
  HttpException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v4 as uuidv4 } from 'uuid';
import { R2Service } from '../../infrastructure/cloudflare_r2/r2.service';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { QdrantService } from '../../infrastructure/qdrant/qdrant.service';
import { GenerateQuizWithAiDto } from './dtos/generate-quiz-with-ai.dto';
import { IngestDocumentDto } from './dtos/ingest-document.dto';
import { RagGenerateDto } from './dtos/rag-generate.dto';
import { ReviewGeneratedContentDto } from './dtos/review-generated-content.dto';
import { DocumentParserService } from './services/document-parser.service';
import { TextEmbedderService } from './services/text-embedder.service';

interface RagChunkRef {
  chunkId: string;
  chunkIndex: number;
  score: number;
  snippet: string;
}

type AiQuizQuestion =
  | {
      type: 'MCQ';
      questionText: string;
      options: string[];
      correctIndex: number;
      maxScore: number;
      explanation?: string;
    }
  | {
      type: 'ESSAY';
      questionText: string;
      expectedAnswer?: string;
      maxScore: number;
    };

@Injectable()
export class AiQuizService {
  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
    private readonly r2Service: R2Service,
    private readonly qdrant: QdrantService,
    private readonly parser: DocumentParserService,
    private readonly embedder: TextEmbedderService,
  ) {}

  private getClient(): GoogleGenerativeAI {
    const apiKey = this.config.get<string>('GEMINI_API_KEY');
    if (!apiKey) {
      throw new BadRequestException(
        'Thiếu cấu hình GEMINI_API_KEY trên backend',
      );
    }
    return new GoogleGenerativeAI(apiKey);
  }

  private parseAiJson(text: string): any | null {
    const candidates: string[] = [];
    const trimmed = String(text ?? '').trim();

    if (trimmed) {
      candidates.push(trimmed);
    }

    const markdownBlockRegex = /```(?:json)?\s*\n([\s\S]*?)\n```/gi;
    let markdownMatch: RegExpExecArray | null = null;
    while ((markdownMatch = markdownBlockRegex.exec(text)) !== null) {
      const block = markdownMatch[1]?.trim();
      if (block) {
        candidates.push(block);
      }
    }

    candidates.push(...this.extractBalancedJsonCandidates(trimmed));

    for (const candidate of candidates) {
      try {
        const parsed = JSON.parse(candidate);
        if (parsed && typeof parsed === 'object') {
          return parsed;
        }
      } catch {
        continue;
      }
    }

    return null;
  }

  private extractBalancedJsonCandidates(input: string): string[] {
    const results: string[] = [];
    const starts: number[] = [];

    for (let i = 0; i < input.length; i += 1) {
      const ch = input[i];
      if (ch === '{') {
        starts.push(i);
      }
      if (ch === '}') {
        for (let j = starts.length - 1; j >= 0; j -= 1) {
          const start = starts[j];
          if (start < i) {
            const candidate = input.slice(start, i + 1).trim();
            if (candidate.length >= 2) {
              results.push(candidate);
            }
          }
        }
      }
    }

    return results;
  }

  private async recoverQuestionsJsonFromText(input: {
    rawText: string;
    totalQuestions: number;
    mcqCount: number;
    essayCount: number;
    language: string;
  }) {
    const client = this.getClient();
    const model = client.getGenerativeModel({
      model: this.getChatModel(),
      generationConfig: {
        responseMimeType: 'application/json',
      },
    });

    const repairPrompt = [
      'Chuyển nội dung sau thành JSON hợp lệ DUY NHẤT theo schema:',
      '{ "questions": [ { "type": "MCQ"|"ESSAY", "questionText": string, "options"?: string[], "correctIndex"?: number, "expectedAnswer"?: string, "explanation"?: string } ] }',
      `Tổng số câu: ${input.totalQuestions}. MCQ: ${input.mcqCount}. ESSAY: ${input.essayCount}.`,
      `Ngôn ngữ: ${input.language}.`,
      'Không thêm markdown hoặc giải thích.',
      'Nội dung gốc:',
      input.rawText,
    ].join('\n\n');

    const result = await model.generateContent({
      contents: [
        {
          role: 'user',
          parts: [{ text: repairPrompt }],
        },
      ],
      generationConfig: {
        temperature: 0,
      },
    });

    const response = await result.response;
    const repairedText = String(response.text() ?? '');
    return this.parseAiJson(repairedText);
  }

  private getChatModel() {
    return (
      this.config.get<string>('GEMINI_MODEL') ??
      this.config.get<string>('OPENROUTER_CHAT_MODEL') ??
      'gemini-2.5-flash'
    );
  }

  private async streamChat(
    messages: Array<{ role: 'system' | 'user'; content: string }>,
    onToken?: (token: string) => void,
  ) {
    const client = this.getClient();
    const [first, ...remaining] = messages;
    const hasSystemInstruction = first?.role === 'system';
    const model = client.getGenerativeModel({
      model: this.getChatModel(),
      ...(hasSystemInstruction
        ? {
            systemInstruction: first.content,
          }
        : {}),
    });

    const promptMessages = hasSystemInstruction ? remaining : messages;
    const prompt = promptMessages
      .map((item) => `${item.role.toUpperCase()}:\n${item.content}`)
      .join('\n\n');

    const stream = await model.generateContentStream({
      contents: [
        {
          role: 'user',
          parts: [{ text: prompt }],
        },
      ],
      generationConfig: {
        temperature: 0.4,
      },
    });

    let text = '';
    for await (const chunk of stream.stream) {
      const content = chunk.text();
      if (typeof content === 'string' && content) {
        text += content;
        if (onToken) {
          onToken(content);
        }
      }
    }

    return String(text ?? '');
  }

  async ingestDocument(
    userId: number,
    dto: IngestDocumentDto,
    file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('File upload is required');
    }

    const parsed = await this.parser.parse(file);
    if (!parsed.text) {
      throw new BadRequestException('Cannot parse text from uploaded file');
    }

    const chunks = this.parser.semanticChunk(parsed.text);
    if (chunks.length === 0) {
      throw new BadRequestException(
        'No semantic chunks generated from file content',
      );
    }

    const fileUrl = await this.r2Service.uploadFile(file);
    const now = new Date();
    let createdDocumentId: string | null = null;

    const chunkRows = chunks.map((rawText, index) => ({
      id: uuidv4(),
      chunk_index: index,
      chunk_type: index === 0 ? 'TITLE' : 'PARAGRAPH',
      page_start: null,
      page_end: null,
      chapter: null,
      section: null,
      raw_text: rawText,
      token_count: Math.ceil(rawText.length / 4),
      document_id: '',
    }));

    try {
      const document = await this.prisma.$transaction(async (tx: any) => {
        const created = await tx.document.create({
          data: {
            title: dto.title,
            type: dto.documentType ?? 'LESSON',
            status: 'DRAFT',
            note: dto.note ?? null,
            grade_level: dto.gradeLevel,
            subject_id: dto.subjectId,
            owner_id: userId,
            class_id: dto.classId ?? null,
            source_file_url: fileUrl,
            source_file_type: parsed.fileType,
            ingestion_status: 'PROCESSING',
            updated_at: now,
          },
          select: { id: true },
        });

        createdDocumentId = created.id;
        const data = chunkRows.map((chunk) => ({
          ...chunk,
          document_id: created.id,
        }));

        await tx.document_chunk.createMany({ data });
        await tx.document.update({
          where: { id: created.id },
          data: {
            chunk_count: data.length,
            updated_at: new Date(),
          },
        });

        return created;
      });

      await this.qdrant.ensureCollection();
      for (const chunk of chunkRows) {
        const vector = await this.embedder.embed(chunk.raw_text);
        await this.qdrant.upsertPoint({
          id: chunk.id,
          vector,
          payload: {
            chunk_id: chunk.id,
            document_id: document.id,
            chunk_index: chunk.chunk_index,
            chunk_type: chunk.chunk_type,
            raw_text: chunk.raw_text,
            source_file_type: parsed.fileType,
          },
        });

        await (this.prisma as any).document_chunk.update({
          where: { id: chunk.id },
          data: {
            embedding_id: chunk.id,
            embedded: true,
            embedded_at: new Date(),
          },
        } as any);
      }

      await this.prisma.document.update({
        where: { id: document.id },
        data: {
          ingestion_status: 'COMPLETED',
          ingestion_done_at: new Date(),
          updated_at: new Date(),
        },
      } as any);

      return {
        documentId: document.id,
        fileUrl,
        fileType: parsed.fileType,
        chunkCount: chunkRows.length,
        qdrantCollection: this.qdrant.getCollectionName(),
      };
    } catch (error: any) {
      if (createdDocumentId) {
        await this.prisma.document.update({
          where: { id: createdDocumentId },
          data: {
            ingestion_status: 'FAILED',
            ingestion_error: String(
              error?.message ?? 'Unknown ingestion error',
            ),
            updated_at: new Date(),
          },
        } as any);
      }

      if (error instanceof HttpException) {
        throw error;
      }

      throw new InternalServerErrorException(
        error?.message ?? 'Failed to ingest document',
      );
    }
  }

  async generateWithRag(
    userId: number,
    documentId: string,
    dto: RagGenerateDto,
  ) {
    return this.generateWithRagInternal(userId, documentId, dto);
  }

  async generateWithRagStream(
    userId: number,
    documentId: string,
    dto: RagGenerateDto,
    onToken: (token: string) => void,
  ) {
    return this.generateWithRagInternal(userId, documentId, dto, onToken);
  }

  private async generateWithRagInternal(
    userId: number,
    documentId: string,
    dto: RagGenerateDto,
    onToken?: (token: string) => void,
  ) {
    const document: any = await this.prisma.document.findFirst({
      where: { id: documentId, owner_id: userId },
      select: {
        id: true,
        title: true,
        ingestion_status: true,
      },
    } as any);

    if (!document) {
      throw new BadRequestException('Document not found or not owned by user');
    }

    if (document.ingestion_status !== 'COMPLETED') {
      throw new BadRequestException('Document is not ready for RAG retrieval');
    }

    const requestId = uuidv4();
    const now = new Date();

    await this.prisma.ai_audit_log.create({
      data: {
        log_id: uuidv4(),
        user_id: userId,
        status: 'STARTED',
        feature: 'AI_RAG_QUIZ_GENERATION',
        request_id: requestId,
        created_at: now,
        updated_at: now,
        document_id: documentId,
        prompt: dto.prompt,
        model: this.getChatModel(),
      },
    } as any);

    try {
      const queryVector = await this.embedder.embed(dto.prompt);
      const hits = await this.qdrant.search({
        vector: queryVector,
        limit: dto.topK ?? 5,
        filter: {
          must: [
            {
              key: 'document_id',
              match: { value: documentId },
            },
          ],
        },
      });

      const chunkIds = hits.map((hit) => hit.id);
      const chunks = await (this.prisma as any).document_chunk.findMany({
        where: {
          id: { in: chunkIds },
          document_id: documentId,
        },
        select: {
          id: true,
          chunk_index: true,
          raw_text: true,
        },
      } as any);

      const chunkById = new Map<
        string,
        { id: string; chunk_index: number; raw_text: string }
      >(
        (
          chunks as Array<{ id: string; chunk_index: number; raw_text: string }>
        ).map((chunk) => [chunk.id, chunk]),
      );
      const references = hits
        .map((hit) => {
          const chunk = chunkById.get(hit.id);
          if (!chunk) {
            return null;
          }

          return {
            chunkId: chunk.id,
            chunkIndex: chunk.chunk_index,
            score: hit.score,
            snippet: String(chunk.raw_text).slice(0, 300),
          };
        })
        .filter((item): item is RagChunkRef => item !== null);

      const contextText = references
        .map(
          (reference, idx: number) =>
            `[Chunk ${idx + 1} | id=${reference.chunkId} | score=${reference.score.toFixed(4)}]\n${chunkById.get(reference.chunkId)?.raw_text ?? ''}`,
        )
        .join('\n\n');

      const systemPrompt = [
        'Bạn là trợ lý tạo đề quiz cho giáo viên từ tài liệu.',
        'YÊU CẦU: Trả về DUY NHẤT một JSON object hợp lệ (không markdown, không giải thích ngoài JSON).',
        'JSON schema bắt buộc:',
        '{ "questions": [ { "type": "MCQ"|"ESSAY", "questionText": string, "options"?: string[], "correctIndex"?: number, "expectedAnswer"?: string, "explanation"?: string } ] }',
        `Chi được sử dụng thông tin từ các chunk trong context để trả lời. Ngôn ngữ: ${dto.language === 'vi' ? 'Tiếng Việt' : (dto.language ?? 'vi')}.`,
        'Nếu context không đủ thông tin thì nói rõ là không đủ dữ liệu.',
      ].join('\n');

      const rawText = await this.streamChat(
        [
          { role: 'system', content: systemPrompt },
          {
            role: 'user',
            content: [
              `Tài liệu: ${document.title}`,
              `Yêu cầu: ${dto.prompt}`,
              'Context:',
              contextText || 'No context found',
            ].join('\n\n'),
          },
        ],
        onToken,
      );

      let parsed = this.parseAiJson(rawText);
      if (!parsed) {
        parsed = await this.recoverQuestionsJsonFromText({
          rawText,
          totalQuestions: 5,
          mcqCount: 5,
          essayCount: 0,
          language: dto.language ?? 'vi',
        });
      }

      if (!parsed) {
        throw new BadRequestException(
          'AI không trả về JSON hợp lệ từ RAG pipeline',
        );
      }

      const questions = this.validateQuestions(
        parsed?.questions,
        (parsed?.questions?.length ?? 0) || 5,
        1,
      );

      await this.prisma.ai_audit_log.updateMany({
        where: { request_id: requestId },
        data: {
          status: 'COMPLETED',
          answer: rawText,
          interaction_data: JSON.stringify({
            references,
            questionsCount: questions.length,
          }),
          completed_at: new Date(),
          updated_at: new Date(),
        },
      } as any);

      return {
        requestId,
        documentId,
        questions,
        references,
      };
    } catch (error: any) {
      await this.prisma.ai_audit_log.updateMany({
        where: { request_id: requestId },
        data: {
          status: 'FAILED',
          error_message: String(error?.message ?? 'Unknown generation error'),
          completed_at: new Date(),
          updated_at: new Date(),
        },
      } as any);

      if (error instanceof HttpException) {
        throw error;
      }

      throw new InternalServerErrorException(
        error?.message ?? 'Failed to generate content with RAG pipeline',
      );
    }
  }

  async reviewGeneratedContent(userId: number, dto: ReviewGeneratedContentDto) {
    const document = await this.prisma.document.findFirst({
      where: { id: dto.documentId, owner_id: userId },
      select: {
        id: true,
        subject_id: true,
        grade_level: true,
      },
    });

    if (!document) {
      throw new BadRequestException('Document not found or not owned by user');
    }

    const chunk = await (this.prisma as any).document_chunk.findFirst({
      where: {
        id: dto.sourceChunkId,
        document_id: dto.documentId,
      },
      select: { id: true },
    } as any);

    if (!chunk) {
      throw new BadRequestException(
        'Chunk does not belong to selected document',
      );
    }

    const created: any = await this.prisma.content_bank.create({
      data: {
        type: dto.contentType,
        subject_id: document.subject_id,
        grade_level: document.grade_level,
        chapter_id: dto.chapterId ?? null,
        section_id: dto.sectionId ?? null,
        payload: dto.payload as any,
        tags: dto.tags ?? [],
        difficulty: dto.difficulty ?? null,
        cognitive_level: dto.cognitiveLevel ?? null,
        is_public: false,
        owner_id: userId,
        source_chunk_id: dto.sourceChunkId,
        review_status: dto.decision,
        review_note: dto.reviewNote ?? null,
        reviewed_by: userId,
        reviewed_at: new Date(),
        updated_at: new Date(),
      },
    } as any);

    await this.prisma.document.update({
      where: { id: dto.documentId },
      data: {
        updated_at: new Date(),
        quiz_count:
          dto.decision === 'REJECTED'
            ? undefined
            : {
                increment: 1,
              },
      },
    } as any);

    if (dto.requestId) {
      await this.prisma.ai_audit_log.updateMany({
        where: { request_id: dto.requestId },
        data: {
          status: `REVIEW_${dto.decision}`,
          chunk_id: dto.sourceChunkId,
          updated_at: new Date(),
        },
      } as any);
    }

    return {
      contentBankId: created.id,
      reviewStatus: created.review_status,
      sourceChunkId: created.source_chunk_id,
    };
  }

  private validateQuestions(
    questions: any,
    totalQuestions: number,
    pointsPerQuestion: number,
  ): AiQuizQuestion[] {
    if (!Array.isArray(questions)) {
      throw new BadRequestException(
        'AI trả về format không hợp lệ (questions)',
      );
    }
    if (questions.length !== totalQuestions) {
      throw new BadRequestException(
        `AI trả về ${questions.length} câu, yêu cầu ${totalQuestions} câu`,
      );
    }

    return questions.map((q, idx) => {
      const type = String(q?.type ?? '').toUpperCase();
      const questionText = String(q?.questionText ?? q?.question ?? '').trim();
      if (!questionText) {
        throw new BadRequestException(
          `Câu ${idx + 1} thiếu nội dung questionText`,
        );
      }

      if (type === 'MCQ') {
        const options = Array.isArray(q?.options) ? q.options.map(String) : [];
        const correctIndex = Number(q?.correctIndex);
        if (options.length < 2) {
          throw new BadRequestException(`Câu ${idx + 1} (MCQ) thiếu options`);
        }
        if (
          !Number.isInteger(correctIndex) ||
          correctIndex < 0 ||
          correctIndex >= options.length
        ) {
          throw new BadRequestException(
            `Câu ${idx + 1} (MCQ) correctIndex không hợp lệ`,
          );
        }
        return {
          type: 'MCQ',
          questionText,
          options,
          correctIndex,
          maxScore: pointsPerQuestion,
          explanation:
            typeof q?.explanation === 'string' ? q.explanation : undefined,
        };
      }

      if (type === 'ESSAY') {
        const expectedAnswer =
          typeof q?.expectedAnswer === 'string' ? q.expectedAnswer : undefined;
        return {
          type: 'ESSAY',
          questionText,
          expectedAnswer,
          maxScore: pointsPerQuestion,
        };
      }

      throw new BadRequestException(
        `Câu ${idx + 1} type không hợp lệ (MCQ/ESSAY)`,
      );
    });
  }

  async generateForQuiz(
    userId: number,
    quizId: string,
    dto: GenerateQuizWithAiDto,
  ) {
    return this.generateForQuizInternal(userId, quizId, dto);
  }

  async generateForQuizStream(
    userId: number,
    quizId: string,
    dto: GenerateQuizWithAiDto,
    onToken: (token: string) => void,
  ) {
    return this.generateForQuizInternal(userId, quizId, dto, onToken);
  }

  private async generateForQuizInternal(
    userId: number,
    quizId: string,
    dto: GenerateQuizWithAiDto,
    onToken?: (token: string) => void,
  ) {
    const quiz = await this.prisma.document.findFirst({
      where: { id: quizId, owner_id: userId },
      select: { id: true },
    });
    if (!quiz) {
      throw new BadRequestException(
        'Quiz không tồn tại hoặc không thuộc quyền bạn',
      );
    }

    const totalQuestions = dto.totalQuestions ?? 10;
    const pointsPerQuestion = dto.pointsPerQuestion ?? 1;

    const mcqCount =
      dto.mcqCount != null
        ? dto.mcqCount
        : Math.max(0, totalQuestions - (dto.essayCount ?? 0));
    const essayCount =
      dto.essayCount != null
        ? dto.essayCount
        : Math.max(0, totalQuestions - mcqCount);

    if (mcqCount + essayCount !== totalQuestions) {
      throw new BadRequestException(
        'Tổng mcqCount + essayCount phải bằng totalQuestions',
      );
    }

    const language = dto.language ?? 'vi';

    const system = [
      'Bạn là trợ lý tạo đề quiz cho giáo viên.',
      'YÊU CẦU: Trả về DUY NHẤT một JSON object hợp lệ (không markdown, không giải thích ngoài JSON).',
      'JSON schema bắt buộc:',
      '{ "questions": [ { "type": "MCQ"|"ESSAY", "questionText": string, "options"?: string[], "correctIndex"?: number, "expectedAnswer"?: string, "explanation"?: string } ] }',
      `Ngôn ngữ câu hỏi: ${language === 'vi' ? 'Tiếng Việt' : language}.`,
      `Tổng số câu: ${totalQuestions}. MCQ: ${mcqCount}. Tự luận: ${essayCount}.`,
      'MCQ: options 4 lựa chọn, correctIndex 0..3.',
      'ESSAY: expectedAnswer ngắn gọn (rubric/đáp án mẫu).',
      `Mỗi câu mặc định 1 điểm (frontend sẽ set maxScore = ${pointsPerQuestion}).`,
    ].join('\n');

    const text = await this.streamChat(
      [
        { role: 'system', content: system },
        { role: 'user', content: dto.prompt },
      ],
      onToken,
    );
    let parsed = this.parseAiJson(text);
    if (!parsed) {
      parsed = await this.recoverQuestionsJsonFromText({
        rawText: text,
        totalQuestions,
        mcqCount,
        essayCount,
        language,
      });
    }

    if (!parsed) {
      throw new BadRequestException('AI không trả về JSON hợp lệ');
    }

    const questions = this.validateQuestions(
      parsed?.questions,
      totalQuestions,
      pointsPerQuestion,
    );

    return {
      quizId,
      questions,
    };
  }
}
