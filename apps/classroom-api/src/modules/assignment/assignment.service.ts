import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { CreateAssignmentDto } from './dtos/create-assignment.dto';
import {
  GradeSubmissionDto,
  SubmitAssignmentDto,
  UpdateAssignmentDto,
} from './dtos/update-assignment.dto';

@Injectable()
export class AssignmentService {
  constructor(private readonly prisma: PrismaService) {}

  async createAssignment(dto: CreateAssignmentDto, userId: number) {
    // Verify classroom exists
    const classroom = await this.prisma.classroom.findUnique({
      where: { class_id: dto.classId },
    });

    if (!classroom) {
      throw new BadRequestException(
        `Classroom with ID ${dto.classId} not found`,
      );
    }

    // Verify user is teacher for this classroom
    const isTeacher = await this.prisma.teacher_classroom.findFirst({
      where: {
        class_id: dto.classId,
        teacher_id: userId,
      },
    });

    if (!isTeacher) {
      throw new ForbiddenException(
        'You must be a teacher of this classroom to create assignments',
      );
    }

    // Create document
    const document = await this.prisma.document.create({
      data: {
        doc_title: dto.title,
        doc_type: dto.assignmentType || 'ASSIGNMENT',
        grade_level: dto.gradeLevel ?? null,
        subject_id: dto.subjectId ?? null,
        note: dto.description ?? null,
        status: 'published',
        owner_id: userId,
      },
    });

    // Create assessment record to link classroom with assignment
    const assessment = await this.prisma.assessment.create({
      data: {
        doc_id: document.doc_id,
        class_id: dto.classId,
        assigned_by: userId,
        status: 'published',
        start_date: new Date(dto.startDate),
        due_date: new Date(dto.dueDate),
      },
    });

    // Create questions if provided (for QUIZ type)
    let questions = [];
    if (dto.questions && dto.questions.length > 0) {
      questions = await Promise.all(
        dto.questions.map((q, index) =>
          this.createQuestion(document.doc_id, q, index),
        ),
      );
    }

    return {
      message: 'Assignment created successfully',
      data: {
        ...this.transformDocumentToAssignment(document, assessment),
        questions,
      },
    };
  }

  async getAssignmentById(id: number) {
    const document = await this.prisma.document.findFirst({
      where: {
        doc_id: id,
        doc_type: { in: ['ASSIGNMENT', 'QUIZ', 'HOMEWORK'] },
      },
      include: {
        assessment: true,
      },
    });

    if (!document) {
      throw new NotFoundException('Assignment not found');
    }

    // Get questions for this assignment
    const questions = await this.getQuestions(id);

    const assessment = document.assessment[0];
    return {
      ...this.transformDocumentToAssignment(document, assessment),
      questions,
    };
  }

  async listAssignments() {
    const documents = await this.prisma.document.findMany({
      where: { doc_type: 'ASSIGNMENT' },
      include: {
        assessment: true,
      },
      orderBy: { updated_at: 'desc' },
    });

    return documents.map((doc) => this.transformDocumentToAssignment(doc));
  }

  async getAssignmentsByClassroom(classId: number) {
    // Get all assessments for this classroom with their documents
    const assessments = await this.prisma.assessment.findMany({
      where: {
        class_id: classId,
      },
      include: {
        document: true,
      },
    });

    // Filter to only ASSIGNMENT type documents and return enriched data
    return assessments
      .filter((a) => a.document?.doc_type === 'ASSIGNMENT')
      .sort((a, b) => {
        // Sort by due_date descending, fallback to updated_at
        const aDate = a.due_date || a.document?.updated_at || new Date(0);
        const bDate = b.due_date || b.document?.updated_at || new Date(0);
        return new Date(bDate).getTime() - new Date(aDate).getTime();
      })
      .map((a) => this.transformDocumentToAssignment(a.document!));
  }

  private transformDocumentToAssignment(doc: any, assessment?: any): any {
    return {
      docId: doc.doc_id,
      docTitle: doc.doc_title,
      docType: doc.doc_type,
      gradeLevel: doc.grade_level || null,
      subjectId: doc.subject_id || null,
      description: doc.note || null,
      status: (doc.status || 'draft').toLowerCase(),
      ownerId: doc.owner_id,
      classId: doc.class_id,
      startDate: assessment?.start_date
        ? new Date(assessment.start_date).toISOString()
        : null,
      dueDate: assessment?.due_date
        ? new Date(assessment.due_date).toISOString()
        : null,
      createdAt: doc.created_at
        ? new Date(doc.created_at).toISOString()
        : new Date().toISOString(),
      updatedAt: doc.updated_at
        ? new Date(doc.updated_at).toISOString()
        : new Date().toISOString(),
    };
  }

  async updateAssignment(id: number, dto: UpdateAssignmentDto) {
    const existing = await this.prisma.document.findFirst({
      where: {
        doc_id: id,
        doc_type: 'ASSIGNMENT',
      },
    });

    if (!existing) {
      throw new NotFoundException('Assignment not found');
    }

    const updatedDoc = await this.prisma.document.update({
      where: { doc_id: id },
      data: {
        doc_title: dto.title ?? existing.doc_title,
        grade_level: dto.gradeLevel ?? existing.grade_level,
        subject_id: dto.subjectId ?? existing.subject_id,
        note: dto.description ?? existing.note,
      },
    });

    return {
      message: 'Assignment updated successfully',
      data: this.transformDocumentToAssignment(updatedDoc),
    };
  }

  async deleteAssignment(id: number) {
    const existing = await this.prisma.document.findFirst({
      where: {
        doc_id: id,
        doc_type: { in: ['ASSIGNMENT', 'QUIZ', 'HOMEWORK'] },
      },
    });

    if (!existing) {
      throw new NotFoundException('Assignment not found');
    }

    // Delete assessment records first
    await this.prisma.assessment.deleteMany({
      where: { doc_id: id },
    });

    // Then delete document
    await this.prisma.document.delete({
      where: { doc_id: id },
    });

    return { message: 'Assignment deleted successfully' };
  }

  /**
   * Create quiz question
   */
  private async createQuestion(
    docId: number,
    question: any,
    order: number,
  ): Promise<any> {
    const block = await this.prisma.layout_block.create({
      data: {
        block_type: 'QUESTION',
        semantic_role: question.questionType,
        layout_config: JSON.stringify({
          questionText: question.questionText,
          options: question.options,
          questionType: question.questionType,
        }),
        content_config: JSON.stringify({
          points: question.points,
          explanation: question.explanation,
        }),
      },
    });

    // Create answer key
    await this.prisma.answer_key.create({
      data: {
        gen_block_id: block.block_id,
        answer_type: question.questionType,
        correct_answer: question.correctAnswer,
        score: question.points,
      },
    });

    return {
      blockId: block.block_id,
      questionText: question.questionText,
      questionType: question.questionType,
      options: question.options || [],
      points: question.points,
      explanation: question.explanation || null,
    };
  }

  /**
   * Get all questions for an assignment
   */
  async getQuestions(docId: number): Promise<any[]> {
    const blocks = await this.prisma.layout_block.findMany({
      where: {
        parent_block_id: null,
      },
      include: {
        answer_key: true,
      },
    });

    return blocks.map((block) => ({
      blockId: block.block_id,
      ...JSON.parse(block.layout_config || '{}'),
      ...JSON.parse(block.content_config || '{}'),
      correctAnswer: block.answer_key[0]?.correct_answer || null,
    }));
  }

  /**
   * Student submits assignment/quiz
   */
  async submitAssignment(
    assessmentId: number,
    studentId: number,
    dto: SubmitAssignmentDto,
  ): Promise<any> {
    // Get assessment
    const assessment = await this.prisma.assessment.findUnique({
      where: { assessment_id: assessmentId },
      include: { document: true },
    });

    if (!assessment) {
      throw new NotFoundException('Assignment not found');
    }

    // Check if student is enrolled in class
    const isEnrolled = await this.prisma.class_student.findFirst({
      where: {
        class_id: assessment.class_id,
        student_id: studentId,
      },
    });

    if (!isEnrolled) {
      throw new ForbiddenException('You are not enrolled in this classroom');
    }

    // Check if past due date
    const now = new Date();
    if (assessment.due_date && new Date(assessment.due_date) < now) {
      throw new BadRequestException(
        'Assignment submission deadline has passed',
      );
    }

    // Create submission record
    const submission = await this.prisma.student_submission.create({
      data: {
        assessment_id: assessmentId,
        student_id: studentId,
        status: 'SUBMITTED',
        started_at: now,
        submitted_at: now,
      },
    });

    // Save answers
    let totalScore = 0;
    const submittedAnswers = [];

    for (const answer of dto.answers) {
      // Get correct answer
      const answerKey = await this.prisma.answer_key.findFirst({
        where: { gen_block_id: answer.genBlockId },
      });

      let isCorrect = false;
      let score = 0;

      if (answerKey) {
        isCorrect =
          answer.studentAnswer.toLowerCase() ===
          answerKey.correct_answer?.toLowerCase();
        score = isCorrect ? Number(answerKey.score || 0) : 0;
        totalScore += score;
      }

      const submissionAns = await this.prisma.submission_ans.create({
        data: {
          attempt_id: submission.attempt_id,
          gen_block_id: answer.genBlockId,
          student_answer: answer.studentAnswer,
          score: score,
        },
      });

      submittedAnswers.push({
        blockId: answer.genBlockId,
        answer: answer.studentAnswer,
        score,
        isCorrect,
      });
    }

    // Update submission with total score
    const updatedSubmission = await this.prisma.student_submission.update({
      where: { attempt_id: submission.attempt_id },
      data: {
        total_score: totalScore,
      },
    });

    return {
      message: 'Assignment submitted successfully',
      submissionId: submission.attempt_id,
      totalScore,
      answers: submittedAnswers,
      submittedAt: updatedSubmission.submitted_at,
    };
  }

  /**
   * Get student submissions for an assignment
   */
  async getSubmissions(assessmentId: number): Promise<any[]> {
    const submissions = await this.prisma.student_submission.findMany({
      where: { assessment_id: assessmentId },
      include: {
        student: {
          include: {
            USER: true,
          },
        },
        submission_ans: {
          include: {
            layout_block: true,
          },
        },
      },
      orderBy: { submitted_at: 'desc' },
    });

    return submissions.map((sub) => ({
      submissionId: sub.attempt_id,
      studentId: sub.student_id,
      studentName: sub.student?.USER?.user_name || 'Unknown',
      status: sub.status,
      totalScore: sub.total_score,
      feedback: sub.feedback,
      submittedAt: sub.submitted_at,
      answers: sub.submission_ans.map((ans) => ({
        blockId: ans.gen_block_id,
        studentAnswer: ans.student_answer,
        score: ans.score,
        feedback: ans.feedback,
      })),
    }));
  }

  /**
   * Get single student submission
   */
  async getStudentSubmission(
    submissionId: number,
    studentId: number,
  ): Promise<any> {
    const submission = await this.prisma.student_submission.findUnique({
      where: { attempt_id: submissionId },
      include: {
        student: {
          include: {
            USER: true,
          },
        },
        submission_ans: {
          include: {
            layout_block: {
              include: { answer_key: true },
            },
          },
        },
      },
    });

    if (!submission) {
      throw new NotFoundException('Submission not found');
    }

    if (submission.student_id !== studentId) {
      throw new ForbiddenException('Cannot view another student submission');
    }

    return {
      submissionId: submission.attempt_id,
      studentId: submission.student_id,
      status: submission.status,
      totalScore: submission.total_score,
      feedback: submission.feedback,
      submittedAt: submission.submitted_at,
      answers: submission.submission_ans.map((ans) => ({
        blockId: ans.gen_block_id,
        studentAnswer: ans.student_answer,
        correctAnswer: ans.layout_block?.answer_key[0]?.correct_answer,
        score: ans.score,
        feedback: ans.feedback,
        maxScore: ans.layout_block?.answer_key[0]?.score,
      })),
    };
  }

  /**
   * Teacher grades submission
   */
  async gradeSubmission(
    submissionId: number,
    teacherId: number,
    dto: GradeSubmissionDto,
  ): Promise<any> {
    const submission = await this.prisma.student_submission.findUnique({
      where: { attempt_id: submissionId },
      include: { assessment: true },
    });

    if (!submission) {
      throw new NotFoundException('Submission not found');
    }

    // Verify teacher is instructor of this class
    const isTeacher = await this.prisma.teacher_classroom.findFirst({
      where: {
        class_id: submission.assessment?.class_id,
        teacher_id: teacherId,
      },
    });

    if (!isTeacher) {
      throw new ForbiddenException(
        'You are not authorized to grade this submission',
      );
    }

    const graded = await this.prisma.student_submission.update({
      where: { attempt_id: submissionId },
      data: {
        total_score: dto.score,
        feedback: dto.feedback,
        status: 'GRADED',
      },
    });

    return {
      message: 'Submission graded successfully',
      submissionId: graded.attempt_id,
      score: graded.total_score,
      feedback: graded.feedback,
      status: graded.status,
    };
  }

  /**
   * Get class statistics for assignment
   */
  async getAssignmentStats(assessmentId: number): Promise<any> {
    const submissions = await this.prisma.student_submission.findMany({
      where: { assessment_id: assessmentId },
    });

    if (submissions.length === 0) {
      return {
        totalStudents: 0,
        submitted: 0,
        graded: 0,
        averageScore: 0,
        highestScore: 0,
        lowestScore: 0,
      };
    }

    const submittedCount = submissions.filter(
      (s) => s.status !== 'NOT_SUBMITTED',
    ).length;
    const gradedCount = submissions.filter((s) => s.status === 'GRADED').length;
    const scores = submissions
      .filter((s) => s.total_score !== null)
      .map((s) => Number(s.total_score));

    const averageScore =
      scores.length > 0 ? scores.reduce((a, b) => a + b) / scores.length : 0;

    return {
      totalStudents: submissions.length,
      submitted: submittedCount,
      graded: gradedCount,
      averageScore: Math.round(averageScore * 100) / 100,
      highestScore: Math.max(...scores, 0),
      lowestScore: Math.min(...scores, 0),
    };
  }
}
