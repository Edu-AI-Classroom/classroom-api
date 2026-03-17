import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { CreateQuestionDto } from './dtos/create-question.dto';
import { CreateQuizDto } from './dtos/create-quiz.dto';
import { ReorderQuestionsDto } from './dtos/reorder-questions.dto';
import { UpdateQuestionDto } from './dtos/update-question.dto';
import { UpdateQuizDto } from './dtos/update-quiz.dto';

type QuizType = 'ASSIGNMENT' | 'EXAM';

@Injectable()
export class TeacherQuizService {
  constructor(private readonly prisma: PrismaService) {}

  private async assertTeacherOwnsQuiz(userId: number, quizId: string) {
    const quiz = await this.prisma.document.findUnique({
      where: { id: quizId },
      include: {
        classroom: { select: { class_id: true, class_name: true } },
        quiz_meta: true as any,
      } as any,
    } as any);

    if (!quiz) throw new NotFoundException('Quiz not found');
    if (quiz.owner_id !== userId)
      throw new ForbiddenException('You do not own this quiz');
    if (quiz.type !== 'ASSIGNMENT' && quiz.type !== 'EXAM') {
      throw new BadRequestException('Document is not a quiz');
    }

    return quiz as any;
  }

  async getOverview(userId: number) {
    const [
      totalQuizzes,
      totalAssignments,
      totalExams,
      totalStudentSubmissions,
    ] = await this.prisma.$transaction([
      this.prisma.document.count({
        where: {
          owner_id: userId,
          type: { in: ['ASSIGNMENT', 'EXAM'] } as any,
        },
      } as any),
      this.prisma.document.count({
        where: { owner_id: userId, type: 'ASSIGNMENT' as any },
      } as any),
      this.prisma.document.count({
        where: { owner_id: userId, type: 'EXAM' as any },
      } as any),
      this.prisma.student_submission.count({
        where: {
          assessment: {
            document: {
              owner_id: userId,
              type: { in: ['ASSIGNMENT', 'EXAM'] } as any,
            } as any,
          } as any,
        } as any,
      } as any),
    ]);

    return {
      totalQuizzes,
      totalAssignments,
      totalExams,
      totalStudentSubmissions,
    };
  }

  async listQuizzes(
    userId: number,
    filters: { search?: string; classId?: number; type?: QuizType },
  ) {
    const where: any = {
      owner_id: userId,
      type: { in: ['ASSIGNMENT', 'EXAM'] },
    };

    if (filters.type) where.type = filters.type;
    if (filters.classId) where.class_id = filters.classId;
    if (filters.search)
      where.title = { contains: filters.search, mode: 'insensitive' };

    const quizzes = await this.prisma.document.findMany({
      where,
      orderBy: { created_at: 'desc' } as any,
      include: {
        classroom: { select: { class_id: true, class_name: true } },
        blocks: { select: { id: true } },
      } as any,
    } as any);

    return quizzes.map((q: any) => ({
      id: q.id,
      title: q.title,
      description: q.note ?? null,
      classroom: q.classroom
        ? { id: q.classroom.class_id, name: q.classroom.class_name }
        : null,
      documentType: q.type,
      questionCount: (q.blocks ?? []).length,
      createdAt: q.created_at,
      status: q.status,
    }));
  }

  async createQuiz(userId: number, dto: CreateQuizDto) {
    const classroom = await this.prisma.classroom.findUnique({
      where: { class_id: dto.classroomId },
      include: { subject: true },
    } as any);

    if (!classroom) throw new BadRequestException('Classroom not found');
    if (classroom.is_deleted)
      throw new BadRequestException('Classroom is deleted');
    if (classroom.grade_level == null || classroom.subject_id == null) {
      throw new BadRequestException(
        'Classroom must have gradeLevel and subject set to create a quiz',
      );
    }

    const created = await this.prisma.$transaction(async (tx: any) => {
      const doc = await tx.document.create({
        data: {
          title: dto.title,
          note: dto.description ?? null,
          type: dto.documentType,
          status: 'DRAFT',
          grade_level: classroom.grade_level,
          subject_id: classroom.subject_id,
          owner_id: userId,
          class_id: dto.classroomId,
        },
      });

      await tx.assessment.create({
        data: {
          doc_id: doc.id,
          class_id: dto.classroomId,
          assigned_by: userId,
          status: 'DRAFT',
        },
      });

      if (dto.timeLimitMinutes != null || dto.totalPoints != null) {
        await tx.quiz_meta.upsert({
          where: { document_id: doc.id },
          create: {
            document_id: doc.id,
            time_limit_minutes: dto.timeLimitMinutes ?? null,
            total_points: dto.totalPoints ?? null,
          },
          update: {
            time_limit_minutes: dto.timeLimitMinutes ?? null,
            total_points: dto.totalPoints ?? null,
          },
        });
      }

      return doc;
    });

    return this.getQuizDetail(userId, created.id);
  }

  async getQuizDetail(userId: number, quizId: string) {
    const quiz = await this.assertTeacherOwnsQuiz(userId, quizId);

    const meta = await (this.prisma as any).quiz_meta?.findUnique?.({
      where: { document_id: quizId },
    });

    return {
      id: quiz.id,
      title: quiz.title,
      description: quiz.note ?? null,
      classroom: quiz.classroom
        ? { id: quiz.classroom.class_id, name: quiz.classroom.class_name }
        : null,
      documentType: quiz.type,
      timeLimitMinutes: meta?.time_limit_minutes ?? null,
      totalPoints: meta?.total_points ?? null,
      createdAt: quiz.created_at,
      status: quiz.status,
    };
  }

  async updateQuiz(userId: number, quizId: string, dto: UpdateQuizDto) {
    const quiz = await this.assertTeacherOwnsQuiz(userId, quizId);

    let classroom = null as any;
    if (dto.classroomId != null) {
      classroom = await this.prisma.classroom.findUnique({
        where: { class_id: dto.classroomId },
      } as any);
      if (!classroom) throw new BadRequestException('Classroom not found');
      if (classroom.grade_level == null || classroom.subject_id == null) {
        throw new BadRequestException(
          'Classroom must have gradeLevel and subject set',
        );
      }
    }

    await this.prisma.$transaction(async (tx: any) => {
      await tx.document.update({
        where: { id: quizId },
        data: {
          title: dto.title ?? quiz.title,
          note: dto.description ?? quiz.note,
          type: (dto.documentType ?? quiz.type) as any,
          class_id: dto.classroomId ?? quiz.class_id,
          grade_level: classroom?.grade_level ?? quiz.grade_level,
          subject_id: classroom?.subject_id ?? quiz.subject_id,
        },
      });

      if (dto.classroomId != null) {
        const assessment = await tx.assessment.findFirst({
          where: { doc_id: quizId },
        });
        if (assessment) {
          await tx.assessment.update({
            where: { assessment_id: assessment.assessment_id },
            data: { class_id: dto.classroomId },
          });
        }
      }

      if (dto.timeLimitMinutes != null || dto.totalPoints != null) {
        await tx.quiz_meta.upsert({
          where: { document_id: quizId },
          create: {
            document_id: quizId,
            time_limit_minutes: dto.timeLimitMinutes ?? null,
            total_points: dto.totalPoints ?? null,
          },
          update: {
            time_limit_minutes: dto.timeLimitMinutes ?? null,
            total_points: dto.totalPoints ?? null,
          },
        });
      }
    });

    return this.getQuizDetail(userId, quizId);
  }

  async deleteQuiz(userId: number, quizId: string) {
    await this.assertTeacherOwnsQuiz(userId, quizId);

    await this.prisma.$transaction(async (tx: any) => {
      await tx.quiz_meta
        ?.delete?.({ where: { document_id: quizId } })
        .catch(() => null);
      await tx.document_block.deleteMany({ where: { document_id: quizId } });
      await tx.assessment.deleteMany({ where: { doc_id: quizId } });
      await tx.document.delete({ where: { id: quizId } });
    });

    return { message: 'Quiz deleted successfully' };
  }

  async getQuizQuestions(userId: number, quizId: string) {
    await this.assertTeacherOwnsQuiz(userId, quizId);

    const blocks = await this.prisma.document_block.findMany({
      where: { document_id: quizId, block_type: 'QUESTION' as any } as any,
      orderBy: { position_order: 'asc' } as any,
      include: { answer_key: true },
    } as any);

    return blocks.map((b: any) => {
      const payload = (b.content ?? {}) as any;
      const questionText = payload.question ?? '';

      if (b.semantic_role === 'MCQ') {
        return {
          id: b.id,
          quizId,
          positionOrder: b.position_order,
          type: 'MCQ',
          questionText,
          options: payload.options ?? [],
          correctIndex: (b.answer_key?.correct_answer as any)?.index ?? 0,
          maxScore: Number(b.answer_key?.score ?? 0),
        };
      }

      return {
        id: b.id,
        quizId,
        positionOrder: b.position_order,
        type: 'ESSAY',
        questionText,
        maxScore: Number(b.answer_key?.score ?? 0),
      };
    });
  }

  async createQuestion(userId: number, dto: CreateQuestionDto) {
    await this.assertTeacherOwnsQuiz(userId, dto.quizId);

    const existing = await this.prisma.document_block.findMany({
      where: { document_id: dto.quizId, block_type: 'QUESTION' as any } as any,
      select: { position_order: true },
    } as any);
    const maxOrder = existing.reduce(
      (m: number, x: any) => Math.max(m, x.position_order ?? 0),
      0,
    );
    const positionOrder = dto.positionOrder ?? maxOrder + 1;

    if (dto.type === 'MCQ') {
      if (!dto.options || dto.options.length < 2)
        throw new BadRequestException('MCQ needs at least 2 options');
      if (
        dto.correctIndex == null ||
        dto.correctIndex < 0 ||
        dto.correctIndex >= dto.options.length
      ) {
        throw new BadRequestException('Invalid correctIndex');
      }
    }

    const created = await this.prisma.$transaction(async (tx: any) => {
      const block = await tx.document_block.create({
        data: {
          document_id: dto.quizId,
          block_type: 'QUESTION',
          semantic_role: dto.type === 'MCQ' ? 'MCQ' : 'ESSAY',
          position_order: positionOrder,
          content:
            dto.type === 'MCQ'
              ? { question: dto.questionText, options: dto.options ?? [] }
              : { question: dto.questionText },
        },
      });

      await tx.answer_key.create({
        data: {
          block_id: block.id,
          answer_type: dto.type,
          correct_answer:
            dto.type === 'MCQ' ? { index: dto.correctIndex } : null,
          score: dto.maxScore,
        },
      });

      return block;
    });

    const [question] = await this.getQuizQuestions(userId, dto.quizId).then(
      (qs) => qs.filter((q) => q.id === created.id),
    );
    return question ?? null;
  }

  async updateQuestion(
    userId: number,
    questionId: string,
    dto: UpdateQuestionDto,
  ) {
    const block: any = await this.prisma.document_block.findUnique({
      where: { id: questionId },
      include: { document: true, answer_key: true },
    } as any);

    if (!block) throw new NotFoundException('Question not found');
    await this.assertTeacherOwnsQuiz(userId, block.document_id);

    const currentContent = (block as any).content as any;

    if (dto.type === 'MCQ') {
      if (dto.options && dto.options.length < 2)
        throw new BadRequestException('MCQ needs at least 2 options');
      if (dto.correctIndex != null) {
        const options = dto.options ?? currentContent?.options ?? [];
        if (dto.correctIndex < 0 || dto.correctIndex >= options.length)
          throw new BadRequestException('Invalid correctIndex');
      }
    }

    await this.prisma.$transaction(async (tx: any) => {
      const nextContent =
        dto.type === 'MCQ'
          ? {
              question: dto.questionText ?? currentContent?.question ?? '',
              options: dto.options ?? currentContent?.options ?? [],
            }
          : {
              question: dto.questionText ?? currentContent?.question ?? '',
            };

      await tx.document_block.update({
        where: { id: questionId },
        data: {
          semantic_role: dto.type === 'MCQ' ? 'MCQ' : 'ESSAY',
          content: nextContent,
        },
      });

      await tx.answer_key.upsert({
        where: { block_id: questionId },
        create: {
          block_id: questionId,
          answer_type: dto.type,
          correct_answer:
            dto.type === 'MCQ' ? { index: dto.correctIndex ?? 0 } : null,
          score: dto.maxScore ?? 0,
        },
        update: {
          answer_type: dto.type,
          correct_answer:
            dto.type === 'MCQ' ? { index: dto.correctIndex ?? 0 } : null,
          score: dto.maxScore ?? block.answer_key?.score ?? 0,
        },
      });
    });

    const quizId = block.document_id;
    const [question] = await this.getQuizQuestions(userId, quizId).then((qs) =>
      qs.filter((q) => q.id === questionId),
    );
    return question ?? null;
  }

  async deleteQuestion(userId: number, questionId: string) {
    const block = await this.prisma.document_block.findUnique({
      where: { id: questionId },
    } as any);
    if (!block) throw new NotFoundException('Question not found');
    await this.assertTeacherOwnsQuiz(userId, (block as any).document_id);

    await this.prisma.document_block.delete({
      where: { id: questionId },
    } as any);
    return { message: 'Question deleted successfully' };
  }

  async reorderQuestions(
    userId: number,
    quizId: string,
    dto: ReorderQuestionsDto,
  ) {
    await this.assertTeacherOwnsQuiz(userId, quizId);
    if (dto.quizId !== quizId) throw new BadRequestException('quizId mismatch');

    const existing = await this.prisma.document_block.findMany({
      where: { document_id: quizId, block_type: 'QUESTION' as any } as any,
      select: { id: true },
    } as any);
    const existingIds = new Set(existing.map((x: any) => x.id));

    for (const id of dto.orderedQuestionIds) {
      if (!existingIds.has(id))
        throw new BadRequestException('Invalid question list');
    }

    await this.prisma.$transaction(
      dto.orderedQuestionIds.map((id, idx) =>
        this.prisma.document_block.update({
          where: { id },
          data: { position_order: idx + 1 },
        } as any),
      ),
    );

    return { message: 'Reordered successfully' };
  }

  async getSubmissionsOverview(userId: number, quizId: string) {
    const quiz = await this.assertTeacherOwnsQuiz(userId, quizId);

    const assessment = await this.prisma.assessment.findFirst({
      where: { doc_id: quizId },
      select: { assessment_id: true, class_id: true },
    } as any);

    if (!assessment) {
      return {
        totalStudentsAttempted: 0,
        averageScore: 0,
        highestScore: 0,
        completionRate: 0,
        attemptsByDay: [],
        scoreDistribution: [],
      };
    }

    const attempts = await this.prisma.student_submission.findMany({
      where: {
        assessment_id: assessment.assessment_id,
        OR: [{ submitted_at: { not: null } }, { status: 'SUBMITTED' }],
      } as any,
      orderBy: { attempt_id: 'desc' } as any,
      select: {
        attempt_id: true,
        student_id: true,
        total_score: true,
        submitted_at: true,
        started_at: true,
      },
    } as any);

    const totalStudents = assessment.class_id
      ? await this.prisma.class_student.count({
          where: { class_id: assessment.class_id },
        } as any)
      : 0;

    const latestByStudent = new Map<number, any>();
    for (const a of attempts) {
      const sid = a.student_id;
      if (!sid) continue;
      if (!latestByStudent.has(sid)) latestByStudent.set(sid, a);
    }

    const latestAttempts = [...latestByStudent.values()];
    const scores = latestAttempts.map((a: any) => Number(a.total_score ?? 0));
    const totalStudentsAttempted = latestAttempts.length;
    const highestScore = scores.length ? Math.max(...scores) : 0;
    const averageScore = scores.length
      ? scores.reduce((s, x) => s + x, 0) / scores.length
      : 0;
    const completionRate =
      totalStudents > 0 ? totalStudentsAttempted / totalStudents : 0;

    // attemptsByDay: last 14 days
    const byDay = new Map<string, number>();
    for (const a of latestAttempts) {
      const d = a.submitted_at ?? a.started_at;
      if (!d) continue;
      const date = new Date(d);
      const key = date.toISOString().slice(0, 10);
      byDay.set(key, (byDay.get(key) ?? 0) + 1);
    }
    const attemptsByDay = [...byDay.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .slice(-14)
      .map(([date, count]) => ({ date, attempts: count }));

    // scoreDistribution: 0-20-40-60-80-100% buckets
    const meta = await (this.prisma as any).quiz_meta?.findUnique?.({
      where: { document_id: quizId },
    });
    const totalPoints =
      meta?.total_points ??
      (await this.prisma.answer_key
        .aggregate({
          where: { block: { document_id: quizId } } as any,
          _sum: { score: true },
        } as any)
        .then((r: any) => Number(r?._sum?.score ?? 0)));

    const buckets = [
      { label: '0–20%', min: 0, max: 0.2 },
      { label: '20–40%', min: 0.2, max: 0.4 },
      { label: '40–60%', min: 0.4, max: 0.6 },
      { label: '60–80%', min: 0.6, max: 0.8 },
      { label: '80–100%', min: 0.8, max: 1.001 },
    ];
    const counts = new Array(buckets.length).fill(0);
    for (const s of scores) {
      const pct = totalPoints > 0 ? s / totalPoints : 0;
      const idx = buckets.findIndex((b) => pct >= b.min && pct < b.max);
      counts[Math.max(0, idx)] += 1;
    }
    const scoreDistribution = buckets.map((b, i) => ({
      bucket: b.label,
      count: counts[i],
    }));

    return {
      totalStudentsAttempted,
      averageScore: Number(averageScore.toFixed(2)),
      highestScore: Number(highestScore.toFixed(2)),
      completionRate,
      attemptsByDay,
      scoreDistribution,
    };
  }
}
