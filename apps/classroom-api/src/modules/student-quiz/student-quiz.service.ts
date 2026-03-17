import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { SubmitQuizDto } from './dtos/submit-quiz.dto';

type QuizType = 'ASSIGNMENT' | 'EXAM';

@Injectable()
export class StudentQuizService {
  constructor(private readonly prisma: PrismaService) {}

  private normalizeText(value: unknown): string {
    if (typeof value !== 'string') return '';
    return value
      .trim()
      .toLowerCase()
      .replace(/\s+/g, ' ');
  }

  private async assertStudentHasAccessToQuiz(userId: number, quizId: string) {
    const assessment = await this.prisma.assessment.findFirst({
      where: { doc_id: quizId } as any,
      select: {
        assessment_id: true,
        class_id: true,
        doc_id: true,
        due_date: true,
      },
    } as any);

    if (!assessment) throw new NotFoundException('Quiz is not assigned');
    if (!assessment.class_id)
      throw new BadRequestException('Quiz has no classroom');

    const isMember = await this.prisma.class_student.findUnique({
      where: {
        class_id_student_id: {
          class_id: assessment.class_id,
          student_id: userId,
        },
      } as any,
      select: { class_id: true },
    } as any);

    if (!isMember)
      throw new ForbiddenException('You are not in this classroom');

    const quiz = await this.prisma.document.findUnique({
      where: { id: quizId },
      select: {
        id: true,
        title: true,
        note: true,
        type: true,
        status: true,
        created_at: true,
        class_id: true,
      } as any,
    } as any);

    if (!quiz) throw new NotFoundException('Quiz not found');
    if (quiz.type !== 'ASSIGNMENT' && quiz.type !== 'EXAM') {
      throw new BadRequestException('Document is not a quiz');
    }

    return { assessment, quiz: quiz as any };
  }

  async listAssignedQuizzes(userId: number, classId?: number) {
    if (!classId) return [];

    const isMember = await this.prisma.class_student.findUnique({
      where: {
        class_id_student_id: { class_id: classId, student_id: userId },
      } as any,
      select: { class_id: true },
    } as any);
    if (!isMember)
      throw new ForbiddenException('You are not in this classroom');

    const assessments = await this.prisma.assessment.findMany({
      where: { class_id: classId } as any,
      include: {
        document: {
          select: {
            id: true,
            title: true,
            note: true,
            type: true,
            status: true,
            created_at: true,
          } as any,
        } as any,
      } as any,
      orderBy: { start_date: 'desc' } as any,
    } as any);

    const quizDocs = assessments
      .map((a: any) => a.document)
      .filter(Boolean)
      .filter(
        (d: any) => d.type === 'ASSIGNMENT' || d.type === 'EXAM',
      ) as any[];

    // last attempt per quiz for this student
    const attempts: any[] = await this.prisma.student_submission.findMany({
      where: {
        student_id: userId,
        assessment: { class_id: classId } as any,
        OR: [{ submitted_at: { not: null } }, { status: 'SUBMITTED' }],
      } as any,
      orderBy: { attempt_id: 'desc' } as any,
      select: {
        attempt_id: true,
        assessment_id: true,
        total_score: true,
        status: true,
        submitted_at: true,
        assessment: { select: { doc_id: true } as any } as any,
      } as any,
    } as any);

    const lastAttemptByQuiz = new Map<string, any>();
    for (const a of attempts) {
      const qid = a.assessment?.doc_id;
      if (!qid) continue;
      if (!lastAttemptByQuiz.has(qid)) lastAttemptByQuiz.set(qid, a);
    }

    return quizDocs.map((q: any) => {
      const a = (assessments as any[]).find((x) => x.document?.id === q.id);
      const lastAttempt = lastAttemptByQuiz.get(q.id) ?? null;
      return {
        id: q.id,
        title: q.title,
        description: q.note ?? null,
        documentType: q.type as QuizType,
        status: q.status,
        createdAt: q.created_at,
        dueDate: a?.due_date ?? null,
        lastAttempt: lastAttempt
          ? {
              attemptId: lastAttempt.attempt_id,
              status: lastAttempt.status ?? null,
              totalScore: lastAttempt.total_score
                ? Number(lastAttempt.total_score)
                : null,
              submittedAt: lastAttempt.submitted_at ?? null,
            }
          : null,
      };
    });
  }

  async getQuizDetail(userId: number, quizId: string) {
    const { quiz, assessment } = await this.assertStudentHasAccessToQuiz(
      userId,
      quizId,
    );
    const meta = await (this.prisma as any).quiz_meta?.findUnique?.({
      where: { document_id: quizId },
    });

    return {
      id: quiz.id,
      title: quiz.title,
      description: quiz.note ?? null,
      documentType: quiz.type,
      timeLimitMinutes: meta?.time_limit_minutes ?? null,
      totalPoints: meta?.total_points ?? null,
      status: quiz.status,
      createdAt: quiz.created_at,
      dueDate: assessment?.due_date ?? null,
      classId: quiz.class_id,
    };
  }

  async getQuizQuestions(userId: number, quizId: string) {
    await this.assertStudentHasAccessToQuiz(userId, quizId);

    const blocks = await this.prisma.document_block.findMany({
      where: { document_id: quizId, block_type: 'QUESTION' as any } as any,
      orderBy: { position_order: 'asc' } as any,
      include: { answer_key: true },
    } as any);

    return blocks.map((b: any) => {
      const payload = (b.content ?? {}) as any;
      const questionText = payload.question ?? '';
      const maxScore = Number(b.answer_key?.score ?? 0);

      if (b.semantic_role === 'MCQ') {
        return {
          id: b.id,
          quizId,
          positionOrder: b.position_order,
          type: 'MCQ',
          questionText,
          options: payload.options ?? [],
          maxScore,
        };
      }

      return {
        id: b.id,
        quizId,
        positionOrder: b.position_order,
        type: 'ESSAY',
        questionText,
        maxScore,
      };
    });
  }

  async startAttempt(userId: number, quizId: string) {
    const { assessment, quiz } = await this.assertStudentHasAccessToQuiz(
      userId,
      quizId,
    );

    if (quiz.type === 'EXAM') {
      const existing = await this.prisma.student_submission.findFirst({
        where: {
          assessment_id: assessment.assessment_id,
          student_id: userId,
          OR: [
            { submitted_at: { not: null } },
            { status: { in: ['SUBMITTED', 'STARTED'] } },
          ],
        } as any,
        select: { attempt_id: true } as any,
        orderBy: { attempt_id: 'desc' } as any,
      } as any);

      if (existing) {
        throw new BadRequestException('EXAM can only be attempted once');
      }
    }

    const attempt = await this.prisma.student_submission.create({
      data: {
        assessment_id: assessment.assessment_id,
        student_id: userId,
        status: 'STARTED',
        started_at: new Date(),
      } as any,
      select: {
        attempt_id: true,
        assessment_id: true,
        student_id: true,
        status: true,
        started_at: true,
      } as any,
    } as any);

    return {
      attemptId: attempt.attempt_id,
      quizId,
      status: attempt.status,
      startedAt: attempt.started_at,
    };
  }

  async submitAttempt(
    userId: number,
    quizId: string,
    attemptId: number,
    dto: SubmitQuizDto,
  ) {
    const { assessment } = await this.assertStudentHasAccessToQuiz(userId, quizId);

    const attempt: any = await this.prisma.student_submission.findUnique({
      where: { attempt_id: attemptId } as any,
      include: { assessment: { select: { doc_id: true } } } as any,
    } as any);

    if (!attempt) throw new NotFoundException('Attempt not found');
    if (attempt.student_id !== userId)
      throw new ForbiddenException('Not your attempt');
    if (attempt.assessment?.doc_id !== quizId)
      throw new BadRequestException('Attempt quiz mismatch');

    const blockIds = dto.answers.map((a) => a.blockId);
    if (new Set(blockIds).size !== blockIds.length) {
      throw new BadRequestException('Duplicate blockId in answers');
    }

    const blocks = await this.prisma.document_block.findMany({
      where: { id: { in: blockIds }, document_id: quizId } as any,
      include: { answer_key: true } as any,
    } as any);
    const blockById = new Map(blocks.map((b: any) => [b.id, b]));

    let totalScore = 0;
    const toUpsert = dto.answers.map((a) => {
      const b: any = blockById.get(a.blockId);
      if (!b) throw new BadRequestException(`Invalid blockId: ${a.blockId}`);

      const isMcq = b.semantic_role === 'MCQ';
      const isEssay = b.semantic_role === 'ESSAY';
      const correctIndex = (b.answer_key?.correct_answer as any)?.index;
      const expectedEssay = (b.answer_key?.correct_answer as any)?.text;
      const maxScore = Number(b.answer_key?.score ?? 0);

      let score: number | null = null;
      let gradingStatus: string | null = 'pending';

      if (isMcq) {
        const studentIndex = (a.answer as any)?.index;
        score = studentIndex === correctIndex ? maxScore : 0;
        gradingStatus = 'verified';
      }

      // Auto-grade ESSAY only when teacher provided an expected answer.
      // Otherwise keep score null for manual grading.
      if (isEssay && expectedEssay) {
        const studentText = this.normalizeText((a.answer as any)?.text);
        const expectedText = this.normalizeText(expectedEssay);
        score = studentText && expectedText && studentText === expectedText ? maxScore : 0;
        gradingStatus = 'verified';
      }

      if (typeof score === 'number') totalScore += score;

      return {
        attempt_id: attemptId,
        block_id: a.blockId,
        student_answer: a.answer,
        score: score == null ? null : score,
        feedback: null,
        grading_status: gradingStatus,
      };
    });

    const submittedAt = new Date();
    const isLate =
      !!assessment?.due_date && submittedAt.getTime() > new Date(assessment.due_date).getTime();

    const updated = await this.prisma.$transaction(async (tx: any) => {
      for (const ans of toUpsert) {
        await tx.submission_ans.upsert({
          where: {
            attempt_id_block_id: {
              attempt_id: ans.attempt_id,
              block_id: ans.block_id,
            },
          },
          create: ans,
          update: {
            student_answer: ans.student_answer,
            score: ans.score,
            feedback: ans.feedback,
            grading_status: ans.grading_status,
            answered_at: new Date(),
          },
        });
      }

      return tx.student_submission.update({
        where: { attempt_id: attemptId },
        data: {
          total_score: totalScore,
          status: isLate ? 'SUBMITTED_LATE' : 'SUBMITTED',
          submitted_at: submittedAt,
        },
        select: {
          attempt_id: true,
          total_score: true,
          status: true,
          submitted_at: true,
        },
      });
    });

    return {
      attemptId: updated.attempt_id,
      quizId,
      status: updated.status,
      totalScore: updated.total_score ? Number(updated.total_score) : 0,
      submittedAt: updated.submitted_at,
    };
  }
}
