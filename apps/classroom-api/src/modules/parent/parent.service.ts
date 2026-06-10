import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { ConsumeParentLinkCodeDto } from './dtos';

@Injectable()
export class ParentService {
  constructor(private readonly prisma: PrismaService) {}

  async consumeLinkCode(parentId: number, dto: ConsumeParentLinkCodeDto) {
    const prisma = this.prisma as any;
    const code = dto.code.trim().toUpperCase();

    const parent = await prisma.parent.findUnique({
      where: { parent_id: parentId },
    });
    if (!parent)
      throw new ForbiddenException('Only parents can use link codes');

    const linkCode = await prisma.parent_link_code.findUnique({
      where: { code },
      include: {
        student: {
          include: {
            USER: {
              select: { user_id: true, user_name: true, email: true },
            },
          },
        },
      },
    });

    if (!linkCode) throw new NotFoundException('Link code not found');
    if (linkCode.is_revoked)
      throw new BadRequestException('Link code was revoked');
    if (linkCode.used_at)
      throw new BadRequestException('Link code was already used');
    if (new Date(linkCode.expires_at).getTime() < Date.now()) {
      throw new BadRequestException('Link code has expired');
    }

    const result = await prisma.$transaction(async (tx: any) => {
      const relation = await tx.parent_student.upsert({
        where: {
          parent_id_student_id: {
            parent_id: parentId,
            student_id: linkCode.student_id,
          },
        },
        create: {
          parent_id: parentId,
          student_id: linkCode.student_id,
          relationship: dto.relationship ?? null,
          status: 'ACTIVE',
        },
        update: {
          relationship: dto.relationship ?? undefined,
          status: 'ACTIVE',
        },
      });

      await tx.parent_link_code.update({
        where: { code },
        data: {
          used_at: new Date(),
          used_by_parent_id: parentId,
        },
      });

      return relation;
    });

    return {
      parentId: result.parent_id,
      studentId: result.student_id,
      relationship: result.relationship,
      linkedAt: result.linked_at,
      status: result.status,
      student: this.mapStudent(linkCode.student),
    };
  }

  async getLinkedStudents(parentId: number) {
    const prisma = this.prisma as any;
    const links = await prisma.parent_student.findMany({
      where: { parent_id: parentId, status: 'ACTIVE' },
      include: {
        student: {
          include: {
            USER: {
              select: {
                user_id: true,
                user_name: true,
                email: true,
                profile_picture: true,
              },
            },
          },
        },
      },
      orderBy: { linked_at: 'desc' },
    });

    return links.map((link: any) => ({
      parentId: link.parent_id,
      studentId: link.student_id,
      relationship: link.relationship,
      linkedAt: link.linked_at,
      status: link.status,
      student: this.mapStudent(link.student),
    }));
  }

  async getStudentClasses(parentId: number, studentId: number) {
    await this.verifyParentStudent(parentId, studentId);
    const prisma = this.prisma as any;

    const rows = await prisma.class_student.findMany({
      where: {
        student_id: studentId,
        classroom: { is_deleted: false },
      },
      include: {
        classroom: {
          include: {
            subject: true,
            teacher_classroom: {
              where: { is_owner: true },
              include: {
                USER: {
                  select: { user_id: true, user_name: true, email: true },
                },
              },
            },
          },
        },
      },
      orderBy: { joined_at: 'desc' },
    });

    return Promise.all(
      rows.map(async (row: any) => {
        const gradebook = await this.getStudentClassGradebook(
          parentId,
          studentId,
          row.class_id,
        );
        return {
          classId: row.classroom.class_id,
          className: row.classroom.class_name,
          subjectId: row.classroom.subject_id,
          subjectName: row.classroom.subject?.subject_name ?? null,
          gradeLevel: row.classroom.grade_level,
          joinedAt: row.joined_at,
          ownerTeacher: row.classroom.teacher_classroom?.[0]
            ? {
                teacherId: row.classroom.teacher_classroom[0].teacher_id,
                teacherName: row.classroom.teacher_classroom[0].USER?.user_name,
                email: row.classroom.teacher_classroom[0].USER?.email,
              }
            : null,
          averageScore: gradebook.averageScore,
          completedAssessments: gradebook.completedAssessments,
          totalAssessments: gradebook.totalAssessments,
        };
      }),
    );
  }

  async getStudentClassGradebook(
    parentId: number,
    studentId: number,
    classId: number,
  ) {
    await this.verifyParentStudent(parentId, studentId);
    await this.verifyStudentInClass(studentId, classId);

    const prisma = this.prisma as any;
    const classroom = await prisma.classroom.findUnique({
      where: { class_id: classId },
      include: { subject: true },
    });

    const assessments = await prisma.assessment.findMany({
      where: { class_id: classId },
      include: {
        document: {
          select: {
            id: true,
            title: true,
            type: true,
            created_at: true,
          },
        },
      },
      orderBy: { start_date: 'desc' },
    });

    const assessmentIds = assessments.map((a: any) => a.assessment_id);
    const attempts = assessmentIds.length
      ? await prisma.student_submission.findMany({
          where: {
            student_id: studentId,
            assessment_id: { in: assessmentIds },
          },
          orderBy: { attempt_id: 'desc' },
          select: {
            attempt_id: true,
            assessment_id: true,
            total_score: true,
            status: true,
            submitted_at: true,
          },
        })
      : [];

    const latest = new Map<number, any>();
    for (const attempt of attempts) {
      if (!latest.has(attempt.assessment_id))
        latest.set(attempt.assessment_id, attempt);
    }

    let total = 0;
    let completed = 0;
    const items = assessments
      .filter((a: any) => a.document)
      .map((a: any) => {
        const attempt = latest.get(a.assessment_id);
        const score =
          attempt?.total_score != null ? Number(attempt.total_score) : null;
        if (score != null) {
          total += score;
          completed += 1;
        }
        return {
          assessmentId: a.assessment_id,
          documentId: a.document.id,
          title: a.document.title,
          documentType: a.document.type,
          startDate: a.start_date,
          dueDate: a.due_date,
          attemptId: attempt?.attempt_id ?? null,
          status: attempt?.status ?? null,
          submittedAt: attempt?.submitted_at ?? null,
          totalScore: score,
        };
      });

    return {
      classId,
      className: classroom?.class_name ?? '',
      subjectName: classroom?.subject?.subject_name ?? null,
      studentId,
      averageScore:
        completed > 0 ? Number((total / completed).toFixed(2)) : null,
      completedAssessments: completed,
      totalAssessments: items.length,
      items,
    };
  }

  async verifyParentStudent(parentId: number, studentId: number) {
    const prisma = this.prisma as any;
    const link = await prisma.parent_student.findFirst({
      where: { parent_id: parentId, student_id: studentId, status: 'ACTIVE' },
    });
    if (!link) {
      throw new ForbiddenException('Parent is not linked to this student');
    }
  }

  private async verifyStudentInClass(studentId: number, classId: number) {
    const prisma = this.prisma as any;
    const classStudent = await prisma.class_student.findUnique({
      where: {
        class_id_student_id: { class_id: classId, student_id: studentId },
      },
    });
    if (!classStudent)
      throw new ForbiddenException('Student is not in this class');
  }

  private mapStudent(student: any) {
    return {
      studentId: student.student_id,
      studentName: student.USER?.user_name ?? '',
      email: student.USER?.email ?? null,
      profilePicture: student.USER?.profile_picture ?? null,
      gradeLevel: student.grade_level,
    };
  }
}
