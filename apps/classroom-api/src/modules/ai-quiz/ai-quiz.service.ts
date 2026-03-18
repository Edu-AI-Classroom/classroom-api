import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OpenRouter } from '@openrouter/sdk';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { GenerateQuizWithAiDto } from './dtos/generate-quiz-with-ai.dto';

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
  ) {}

  private getClient() {
    const apiKey = this.config.get<string>('OPENROUTER_API_KEY');
    if (!apiKey) {
      throw new BadRequestException(
        'Thiếu cấu hình OPENROUTER_API_KEY trên backend',
      );
    }
    return new OpenRouter({ apiKey });
  }

  private extractJsonObject(text: string) {
    const first = text.indexOf('{');
    const last = text.lastIndexOf('}');
    if (first < 0 || last < 0 || last <= first) return null;
    return text.slice(first, last + 1);
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
    const openrouter = this.getClient();

    const system = [
      'Bạn là trợ lý tạo đề quiz cho giáo viên.',
      'YÊU CẦU: Trả về DUY NHẤT một JSON object hợp lệ (không markdown, không giải thích ngoài JSON).',
      'JSON schema bắt buộc:',
      '{ "questions": [ { "type": "MCQ"|"ESSAY", "questionText": string, "options"?: string[], "correctIndex"?: number, "expectedAnswer"?: string, "explanation"?: string } ] }',
      'NGÔN NGỮ: TẤT CẢ nội dung (câu hỏi, phương án, giải thích, đáp án mẫu) PHẢI ĐƯỢC VIẾT BẰNG TIẾNG VIỆT.',
      `Tổng số câu: ${totalQuestions}. MCQ: ${mcqCount}. Tự luận: ${essayCount}.`,
      'MCQ: options 4 lựa chọn, correctIndex 0..3.',
      'ESSAY: expectedAnswer BẮT BUỘC chỉ được 1 từ duy nhất (ví dụ: "3/4", "điện", "biến").',
      `Mỗi câu mặc định 1 điểm (frontend sẽ set maxScore = ${pointsPerQuestion}).`,
    ].join('\n');

    const stream = await openrouter.chat.send({
      chatGenerationParams: {
        model: 'nvidia/nemotron-3-super-120b-a12b:free',
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: dto.prompt },
        ],
        temperature: 0.4,
        stream: true,
      },
    });

    let text = '';
    for await (const chunk of stream as any) {
      const content = chunk?.choices?.[0]?.delta?.content;
      if (typeof content === 'string' && content) {
        text += content;
      }
    }

    text = String(text ?? '');
    const jsonStr = this.extractJsonObject(text);
    if (!jsonStr) {
      throw new BadRequestException('AI không trả về JSON hợp lệ');
    }

    let parsed: any;
    try {
      parsed = JSON.parse(jsonStr);
    } catch {
      throw new BadRequestException('Không parse được JSON từ AI');
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
