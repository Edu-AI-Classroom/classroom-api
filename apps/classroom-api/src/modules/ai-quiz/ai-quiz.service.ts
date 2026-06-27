import { GoogleGenerativeAI } from '@google/generative-ai';
import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
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

type AiGenerationUsage = {
  tokensCharged: number;
  tokensRemaining: number;
};

@Injectable()
export class AiQuizService {
  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  private getClient(): GoogleGenerativeAI {
    const apiKey = this.config.get<string>('GEMINI_API_KEY');
    if (!apiKey) {
      throw new BadRequestException(
        'Thiáº¿u cáº¥u hÃ¬nh GEMINI_API_KEY trÃªn backend',
      );
    }
    return new GoogleGenerativeAI(apiKey);
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
        'AI tráº£ vá» format khÃ´ng há»£p lá»‡ (questions)',
      );
    }
    if (questions.length !== totalQuestions) {
      throw new BadRequestException(
        `AI tráº£ vá» ${questions.length} cÃ¢u, yÃªu cáº§u ${totalQuestions} cÃ¢u`,
      );
    }

    return questions.map((q, idx) => {
      const type = String(q?.type ?? '').toUpperCase();
      const questionText = String(q?.questionText ?? q?.question ?? '').trim();
      if (!questionText) {
        throw new BadRequestException(
          `CÃ¢u ${idx + 1} thiáº¿u ná»™i dung questionText`,
        );
      }

      if (type === 'MCQ') {
        const options = Array.isArray(q?.options) ? q.options.map(String) : [];
        const correctIndex = Number(q?.correctIndex);
        if (options.length < 2) {
          throw new BadRequestException(
            `CÃ¢u ${idx + 1} (MCQ) thiáº¿u options`,
          );
        }
        if (
          !Number.isInteger(correctIndex) ||
          correctIndex < 0 ||
          correctIndex >= options.length
        ) {
          throw new BadRequestException(
            `CÃ¢u ${idx + 1} (MCQ) correctIndex khÃ´ng há»£p lá»‡`,
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
        `CÃ¢u ${idx + 1} type khÃ´ng há»£p lá»‡ (MCQ/ESSAY)`,
      );
    });
  }

  private estimateTokenCost(
    dto: GenerateQuizWithAiDto,
    totalQuestions: number,
    essayCount: number,
  ) {
    const promptLength = dto.prompt?.trim().length ?? 0;
    const promptUnits = Math.ceil(promptLength / 200);
    return Math.max(1, totalQuestions * 8 + essayCount * 4 + promptUnits * 3);
  }

  private async reserveAiTokens(
    userId: number,
    tokensToCharge: number,
  ): Promise<number> {
    const result = await this.prisma.uSER.updateMany({
      where: {
        user_id: userId,
        credit: { gte: tokensToCharge },
      } as any,
      data: {
        credit: {
          decrement: tokensToCharge,
        },
      } as any,
    } as any);

    if (result.count === 0) {
      const user = await this.prisma.uSER.findUnique({
        where: { user_id: userId },
        select: { credit: true },
      });
      const currentCredit = user?.credit ?? 0;
      throw new BadRequestException(
        `Insufficient AI tokens. Required ${tokensToCharge}, available ${currentCredit}`,
      );
    }

    const updatedUser = await this.prisma.uSER.findUnique({
      where: { user_id: userId },
      select: { credit: true },
    });

    return updatedUser?.credit ?? 0;
  }

  private async refundAiTokens(userId: number, tokensToRefund: number) {
    if (tokensToRefund <= 0) return;
    await this.prisma.uSER.update({
      where: { user_id: userId },
      data: {
        credit: {
          increment: tokensToRefund,
        },
      },
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
        'Quiz khÃ´ng tá»“n táº¡i hoáº·c khÃ´ng thuá»™c quyá»n báº¡n',
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
        'Tá»•ng mcqCount + essayCount pháº£i báº±ng totalQuestions',
      );
    }

    const tokensToCharge = this.estimateTokenCost(
      dto,
      totalQuestions,
      essayCount,
    );
    const tokensRemainingAfterCharge = await this.reserveAiTokens(
      userId,
      tokensToCharge,
    );

    try {
      const genAI = this.getClient();
      const model = genAI.getGenerativeModel({
        model: 'gemini-2.5-flash',
        generationConfig: {
          responseMimeType: 'application/json',
        },
      });

      const system = [
        'Báº¡n lÃ  trá»£ lÃ½ táº¡o Ä‘á» quiz cho giÃ¡o viÃªn.',
        'YÃŠU Cáº¦U: Tráº£ vá» má»™t JSON object há»£p lá»‡ (khÃ´ng giáº£i thÃ­ch ngoÃ i JSON).',
        'JSON schema báº¯t buá»™c:',
        '{ "questions": [ { "type": "MCQ"|"ESSAY", "questionText": string, "options"?: string[], "correctIndex"?: number, "expectedAnswer"?: string, "explanation"?: string } ] }',
        'NGÃ”N NGá»®: Táº¤T Cáº¢ ná»™i dung (cÃ¢u há»i, phÆ°Æ¡ng Ã¡n, giáº£i thÃ­ch, Ä‘Ã¡p Ã¡n máº«u) PHáº¢I ÄÆ¯á»¢C VIáº¾T Báº°NG TIáº¾NG VIá»†T.',
        `Tá»•ng sá»‘ cÃ¢u: ${totalQuestions}. MCQ: ${mcqCount}. Tá»± luáº­n: ${essayCount}.`,
        'MCQ: options 4 lá»±a chá»n, correctIndex 0..3.',
        'ESSAY: expectedAnswer Báº®T BUá»˜C chá»‰ Ä‘Æ°á»£c 1 tá»« duy nháº¥t.',
        `Má»—i cÃ¢u máº·c Ä‘á»‹nh 1 Ä‘iá»ƒm (frontend sáº½ set maxScore = ${pointsPerQuestion}).`,
      ].join('\n');

      const result = await model.generateContent({
        contents: [
          {
            role: 'user',
            parts: [{ text: system }, { text: dto.prompt }],
          },
        ],
        generationConfig: {
          temperature: 0.4,
        },
      });

      const response = await result.response;
      const text = String(response.text() ?? '');
      const jsonStr = this.extractJsonObject(text);
      if (!jsonStr) {
        throw new BadRequestException('AI khÃ´ng tráº£ vá» JSON há»£p lá»‡');
      }

      let parsed: any;
      try {
        parsed = JSON.parse(jsonStr);
      } catch {
        throw new BadRequestException('KhÃ´ng parse Ä‘Æ°á»£c JSON tá»« AI');
      }

      const questions = this.validateQuestions(
        parsed?.questions,
        totalQuestions,
        pointsPerQuestion,
      );

      return {
        quizId,
        questions,
        usage: {
          tokensCharged: tokensToCharge,
          tokensRemaining: tokensRemainingAfterCharge,
        } satisfies AiGenerationUsage,
      };
    } catch (error) {
      await this.refundAiTokens(userId, tokensToCharge);
      throw error;
    }
  }
}
