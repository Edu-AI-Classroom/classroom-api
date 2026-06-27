import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import {
  AddStudentDto,
  AddTeacherDto,
  AssignStudentToGroupDto,
  ClassroomResponseDto,
  CreateClassroomDto,
  CreateGroupDto,
  GroupResponseDto,
  JoinClassDto,
  StudentResponseDto,
  TeacherResponseDto,
  UpdateClassroomDto,
  UpdateGroupDto,
} from './dtos';

@Injectable()
export class ClassroomService {
  constructor(private readonly prisma: PrismaService) {}

  async getClassGradebook(userId: number, classId: number) {
    // Teachers only (but verify access first)
    await this.verifyUserAccessToClassroom(userId, classId);

    const classroom = await this.prisma.classroom.findUnique({
      where: { class_id: classId },
      select: { created_by: true } as any,
    } as any);

    const isTeacher = await this.prisma.teacher_classroom.findFirst({
      where: { class_id: classId, teacher_id: userId } as any,
      select: { teacher_id: true } as any,
    } as any);

    // Backward compatibility: allow class owner even if teacher_classroom row is missing
    if (!isTeacher && classroom?.created_by !== userId) {
      throw new ForbiddenException('Only teachers can view the gradebook');
    }

    const [students, assessments] = await Promise.all([
      this.prisma.class_student.findMany({
        where: { class_id: classId } as any,
        include: {
          student: {
            include: {
              USER: {
                select: { user_id: true, user_name: true, email: true } as any,
              } as any,
            } as any,
          } as any,
        } as any,
      } as any),
      this.prisma.assessment.findMany({
        where: { class_id: classId } as any,
        include: {
          document: {
            select: {
              id: true,
              title: true,
              type: true,
              created_at: true,
            } as any,
          } as any,
        } as any,
        orderBy: { start_date: 'desc' } as any,
      } as any),
    ]);

    const quizzes = (assessments as any[])
      .map((a) => a.document)
      .filter(Boolean)
      .filter((d: any) => d.type === 'ASSIGNMENT' || d.type === 'EXAM')
      .map((d: any) => ({
        id: d.id,
        title: d.title,
        documentType: d.type,
        createdAt: d.created_at,
      }));

    const assessmentByDocId = new Map<string, any>();
    for (const a of assessments as any[]) {
      if (a.document?.id) assessmentByDocId.set(a.document.id, a);
    }

    const assessmentIds = (assessments as any[]).map((a) => a.assessment_id);
    const submissions = assessmentIds.length
      ? await this.prisma.student_submission.findMany({
          where: { assessment_id: { in: assessmentIds } } as any,
          orderBy: { attempt_id: 'desc' } as any,
          select: {
            attempt_id: true,
            assessment_id: true,
            student_id: true,
            total_score: true,
            status: true,
            submitted_at: true,
          } as any,
        } as any)
      : [];

    // latest attempt per (student, assessment)
    const latest = new Map<string, any>();
    for (const s of submissions as any[]) {
      const key = `${s.student_id}:${s.assessment_id}`;
      if (!latest.has(key)) latest.set(key, s);
    }

    const rows = (students as any[]).map((cs) => {
      const u = cs.student?.USER;
      const studentId = cs.student_id;

      const grades: Record<string, any> = {};
      let total = 0;
      let gradedCount = 0;

      for (const q of quizzes) {
        const a = assessmentByDocId.get(q.id);
        if (!a) continue;
        const key = `${studentId}:${a.assessment_id}`;
        const attempt = latest.get(key);
        const score =
          attempt?.total_score != null ? Number(attempt.total_score) : null;
        if (score != null) {
          total += score;
          gradedCount += 1;
        }
        grades[q.id] = {
          attemptId: attempt?.attempt_id ?? null,
          status: attempt?.status ?? null,
          submittedAt: attempt?.submitted_at ?? null,
          totalScore: score,
        };
      }

      const averageScore = gradedCount > 0 ? total / gradedCount : null;

      return {
        student: {
          id: u?.user_id ?? studentId,
          name: u?.user_name ?? '',
          email: u?.email ?? null,
        },
        averageScore:
          averageScore != null ? Number(averageScore.toFixed(2)) : null,
        grades,
      };
    });

    return {
      classId,
      quizzes,
      rows,
    };
  }

  /**
   * Create a new classroom
   * The authenticated user becomes the owner
   */
  async createClassroom(
    userId: number,
    createClassroomDto: CreateClassroomDto,
  ): Promise<ClassroomResponseDto> {
    const { className, gradeLevel, subjectId } = createClassroomDto;

    await this.enforceClassroomQuota(userId);

    // Verify subject exists
    const subject = await this.prisma.subject.findUnique({
      where: { subject_id: subjectId },
    });

    if (!subject) {
      throw new BadRequestException(`Subject with ID ${subjectId} not found`);
    }

    // Create classroom
    const classroom = await this.prisma.classroom.create({
      data: {
        class_name: className,
        grade_level: gradeLevel,
        subject_id: subjectId,
        created_by: userId,
        // Add the creator as a teacher with owner privileges
        teacher_classroom: {
          create: {
            teacher_id: userId,
            is_owner: true,
          },
        },
      },
      include: {
        subject: true,
        USER: true,
        teacher_classroom: true,
        class_student: true,
        class_group: true,
      },
    });

    return this.mapClassroomToResponse(classroom, userId);
  }

  private async enforceClassroomQuota(userId: number) {
    const personalInfo = await this.prisma.personal_info.findUnique({
      where: { user_id: userId },
      include: { subscription_plan: true },
    });

    const plan = personalInfo?.subscription_plan;
    if (!personalInfo || !plan || personalInfo.sub_status !== 'ACTIVE') {
      return;
    }

    if (!personalInfo.sub_start_date || !plan.duration_days) {
      return;
    }

    const expiryDate = new Date(personalInfo.sub_start_date);
    expiryDate.setDate(expiryDate.getDate() + plan.duration_days);

    if (expiryDate.getTime() < Date.now()) {
      return;
    }

    if (plan.max_classes == null || plan.max_classes <= 0) {
      return;
    }

    const ownedClassCount = await this.prisma.teacher_classroom.count({
      where: {
        teacher_id: userId,
        is_owner: true,
      } as any,
    } as any);

    if (ownedClassCount >= plan.max_classes) {
      throw new ForbiddenException(
        `You have reached the class limit for plan ${plan.sub_name} (${plan.max_classes} classes)`,
      );
    }
  }

  /**
   * Get classroom by ID
   */
  async getClassroom(
    classId: number,
    userId: number,
  ): Promise<ClassroomResponseDto> {
    const classroom = await this.prisma.classroom.findUnique({
      where: { class_id: classId },
      include: {
        subject: true,
        USER: true,
        teacher_classroom: true,
        class_student: true,
        class_group: true,
      },
    });

    if (!classroom) {
      throw new NotFoundException(`Classroom with ID ${classId} not found`);
    }

    // Verify user is authorized to view this classroom
    await this.verifyUserAccessToClassroom(userId, classId);

    return this.mapClassroomToResponse(classroom, userId);
  }

  /**
   * Get all classrooms for the current user
   */
  async getMyClassrooms(
    userId: number,
    paginationDto: PaginationDto,
  ): Promise<{
    data: ClassroomResponseDto[];
    total: number;
    page: number;
    limit: number;
  }> {
    const { page = 1, limit = 10 } = paginationDto;
    const skip = (page - 1) * limit;

    const [classrooms, total] = await Promise.all([
      this.prisma.classroom.findMany({
        where: {
          AND: [
            { is_deleted: false },
            {
              OR: [
                { created_by: userId },
                {
                  teacher_classroom: {
                    some: {
                      teacher_id: userId,
                    },
                  },
                },
                {
                  class_student: {
                    some: {
                      student_id: userId,
                    },
                  },
                },
              ],
            },
          ],
        },
        include: {
          subject: true,
          USER: true,
          teacher_classroom: true,
          class_student: true,
          class_group: true,
        },
        skip,
        take: limit,
        orderBy: { created_at: 'desc' },
      }),
      this.prisma.classroom.count({
        where: {
          AND: [
            { is_deleted: false },
            {
              OR: [
                { created_by: userId },
                {
                  teacher_classroom: {
                    some: {
                      teacher_id: userId,
                    },
                  },
                },
                {
                  class_student: {
                    some: {
                      student_id: userId,
                    },
                  },
                },
              ],
            },
          ],
        },
      }),
    ]);

    return {
      data: classrooms.map((classroom) =>
        this.mapClassroomToResponse(classroom, userId),
      ),
      total,
      page,
      limit,
    };
  }

  /**
   * Update classroom information
   */
  async updateClassroom(
    classId: number,
    userId: number,
    updateClassroomDto: UpdateClassroomDto,
  ): Promise<ClassroomResponseDto> {
    // Verify user is authorized to update this classroom
    await this.verifyUserIsTeacher(userId, classId);

    const classroom = await this.prisma.classroom.update({
      where: { class_id: classId },
      data: {
        ...(updateClassroomDto.className && {
          class_name: updateClassroomDto.className,
        }),
        ...(updateClassroomDto.gradeLevel && {
          grade_level: updateClassroomDto.gradeLevel,
        }),
        ...(updateClassroomDto.subjectId && {
          subject_id: updateClassroomDto.subjectId,
        }),
      },
      include: {
        subject: true,
        USER: true,
        teacher_classroom: true,
        class_student: true,
        class_group: true,
      },
    });

    return this.mapClassroomToResponse(classroom, userId);
  }

  /**
   * Delete classroom (soft delete)
   */
  async deleteClassroom(classId: number, userId: number): Promise<void> {
    // Only owner can delete
    await this.verifyUserIsOwner(userId, classId);

    await this.prisma.classroom.update({
      where: { class_id: classId },
      data: { is_deleted: true },
    });
  }

  /**
   * Add a teacher to the classroom
   * Only the owner can add teachers
   */
  async addTeacher(
    classId: number,
    userId: number,
    addTeacherDto: AddTeacherDto,
  ): Promise<TeacherResponseDto> {
    // Only owner can add teachers
    await this.verifyUserIsOwner(userId, classId);

    // Find teacher by email
    const teacher = await this.prisma.uSER.findUnique({
      where: { email: addTeacherDto.email },
    });

    if (!teacher) {
      throw new NotFoundException(
        `Teacher with email ${addTeacherDto.email} not found`,
      );
    }

    // Check if teacher is already in the classroom
    const existingTeacher = await this.prisma.teacher_classroom.findUnique({
      where: {
        teacher_id_class_id: {
          teacher_id: teacher.user_id,
          class_id: classId,
        },
      },
    });

    if (existingTeacher) {
      throw new BadRequestException(
        `Teacher with email ${addTeacherDto.email} is already in this classroom`,
      );
    }

    // Add teacher to classroom
    await this.prisma.teacher_classroom.create({
      data: {
        teacher_id: teacher.user_id,
        class_id: classId,
        is_owner: false,
      },
    });

    return {
      teacherId: teacher.user_id,
      teacherName: teacher.user_name,
      email: teacher.email,
      isOwner: false,
    };
  }

  /**
   * Remove a teacher from the classroom
   * Only the owner can remove teachers
   */
  async removeTeacher(
    classId: number,
    userId: number,
    teacherId: number,
  ): Promise<void> {
    // Only owner can remove teachers
    await this.verifyUserIsOwner(userId, classId);

    // Cannot remove the owner
    const teacher = await this.prisma.teacher_classroom.findUnique({
      where: {
        teacher_id_class_id: {
          teacher_id: teacherId,
          class_id: classId,
        },
      },
    });

    if (!teacher) {
      throw new NotFoundException('Teacher not found in this classroom');
    }

    if (teacher.is_owner) {
      throw new BadRequestException('Cannot remove the classroom owner');
    }

    await this.prisma.teacher_classroom.delete({
      where: {
        teacher_id_class_id: {
          teacher_id: teacherId,
          class_id: classId,
        },
      },
    });
  }

  /**
   * Get all teachers in a classroom
   */
  async getClassroomTeachers(
    classId: number,
    userId: number,
  ): Promise<TeacherResponseDto[]> {
    await this.verifyUserAccessToClassroom(userId, classId);

    const teachers = await this.prisma.teacher_classroom.findMany({
      where: { class_id: classId },
      include: {
        USER: true, // Phải dùng 'USER' vì schema định nghĩa là USER
      },
    });

    return teachers.map((tc) => ({
      // Truy cập thông qua tc.USER
      teacherId: tc.USER.user_id,
      teacherName: tc.USER.user_name, // Giả sử trường tên là full_name hoặc user_name
      email: tc.USER.email,
      addedAt: tc.added_at?.toISOString(),
      isOwner: tc.is_owner,
    }));
  }

  /**
   * Add a student to the classroom
   * If student doesn't exist, create a new student account
   */
  /**
   * Add a student to the classroom
   * Only existing students (by email) can be added
   */
  async addStudent(
    classId: number,
    userId: number,
    addStudentDto: AddStudentDto,
  ): Promise<StudentResponseDto> {
    // Verify user is teacher in this classroom
    await this.verifyUserIsTeacher(userId, classId);

    // Find student by email - must exist in system
    const user = await this.prisma.uSER.findUnique({
      where: { email: addStudentDto.email },
    });

    if (!user) {
      throw new NotFoundException(
        `User with email ${addStudentDto.email} not found in the system`,
      );
    }

    // Check if user has student profile
    const student = await this.prisma.student.findUnique({
      where: { student_id: user.user_id },
    });

    if (!student) {
      throw new BadRequestException(
        `User with email ${addStudentDto.email} is not a student`,
      );
    }

    // Check if student is already in the classroom
    const existingStudent = await this.prisma.class_student.findUnique({
      where: {
        class_id_student_id: {
          class_id: classId,
          student_id: user.user_id,
        },
      },
    });

    if (existingStudent) {
      throw new BadRequestException('Student is already in this classroom');
    }

    // Add student to classroom
    const classStudent = await this.prisma.class_student.create({
      data: {
        class_id: classId,
        student_id: user.user_id,
      },
      include: {
        student: {
          include: {
            USER: true,
            group_student: {
              where: {
                class_group: {
                  class_id: classId,
                  is_deleted: false,
                },
              },
              include: {
                class_group: true,
              },
            },
          },
        },
      },
    });

    return this.mapStudentToResponse(classStudent, classId);
  }

  /**
   * Remove a student from the classroom
   */
  async removeStudent(
    classId: number,
    userId: number,
    studentId: number,
  ): Promise<void> {
    // Verify user is teacher in this classroom
    await this.verifyUserIsTeacher(userId, classId);

    const student = await this.prisma.class_student.findUnique({
      where: {
        class_id_student_id: {
          class_id: classId,
          student_id: studentId,
        },
      },
    });

    if (!student) {
      throw new NotFoundException('Student not found in this classroom');
    }

    // Remove student from all groups in this classroom
    await this.prisma.group_student.deleteMany({
      where: {
        student_id: studentId,
        class_group: {
          class_id: classId,
        },
      },
    });

    // Remove student from classroom
    await this.prisma.class_student.delete({
      where: {
        class_id_student_id: {
          class_id: classId,
          student_id: studentId,
        },
      },
    });
  }

  /**
   * Get all students in a classroom
   */
  async getClassroomStudents(
    classId: number,
    userId: number,
    paginationDto: PaginationDto,
  ): Promise<{
    data: StudentResponseDto[];
    total: number;
    page: number;
    limit: number;
  }> {
    // Verify user has access to this classroom
    await this.verifyUserAccessToClassroom(userId, classId);

    const { page = 1, limit = 10 } = paginationDto;
    const skip = (page - 1) * limit;

    const [students, total] = await Promise.all([
      this.prisma.class_student.findMany({
        where: { class_id: classId },
        include: {
          student: {
            include: {
              USER: true,
              group_student: {
                where: {
                  class_group: {
                    class_id: classId,
                    is_deleted: false,
                  },
                },
                include: {
                  class_group: true,
                },
              },
            },
          },
        },
        skip,
        take: limit,
        orderBy: { joined_at: 'desc' },
      }),
      this.prisma.class_student.count({
        where: { class_id: classId },
      }),
    ]);

    return {
      data: students.map((student) =>
        this.mapStudentToResponse(student, classId),
      ),
      total,
      page,
      limit,
    };
  }

  async getStudentQuizStats(classId: number, userId: number) {
    await this.verifyUserIsTeacher(userId, classId);

    const classStudents = await this.prisma.class_student.findMany({
      where: { class_id: classId } as any,
      select: { student_id: true } as any,
    } as any);
    const studentIds = classStudents
      .map((s: any) => s.student_id)
      .filter(Boolean);

    const assessments = await this.prisma.assessment.findMany({
      where: {
        class_id: classId,
        document: { type: { in: ['ASSIGNMENT', 'EXAM'] } as any },
      } as any,
      select: { assessment_id: true, doc_id: true } as any,
    } as any);
    const totalAssigned = assessments.length;
    const assessmentIds = assessments.map((a: any) => a.assessment_id);
    const docIds = assessments.map((a: any) => a.doc_id).filter(Boolean);

    const metaList = await (this.prisma as any).quiz_meta?.findMany?.({
      where: { document_id: { in: docIds } },
      select: { document_id: true, total_points: true } as any,
    });
    const totalPointsByDoc = new Map<string, number>(
      (metaList ?? []).map((m: any) => [
        m.document_id,
        Number(m.total_points ?? 0),
      ]),
    );

    await Promise.all(
      docIds
        .filter(
          (id: string) =>
            !totalPointsByDoc.has(id) || totalPointsByDoc.get(id) === 0,
        )
        .map(async (docId: string) => {
          const sum = await this.prisma.answer_key
            .aggregate({
              where: { block: { document_id: docId } } as any,
              _sum: { score: true },
            } as any)
            .then((r: any) => Number(r?._sum?.score ?? 0));
          totalPointsByDoc.set(docId, sum);
        }),
    );

    const attempts = await this.prisma.student_submission.findMany({
      where: {
        student_id: { in: studentIds },
        assessment_id: { in: assessmentIds },
        OR: [{ submitted_at: { not: null } }, { status: 'SUBMITTED' }],
      } as any,
      orderBy: { attempt_id: 'desc' } as any,
      select: {
        attempt_id: true,
        student_id: true,
        assessment_id: true,
        total_score: true,
        assessment: { select: { doc_id: true } as any } as any,
      } as any,
    } as any);

    // latest attempt per (student, assessment)
    const latest = new Map<string, any>();
    for (const a of attempts) {
      const key = `${a.student_id}-${a.assessment_id}`;
      if (!latest.has(key)) latest.set(key, a);
    }

    const acc = new Map<number, { submitted: number; pctSum: number }>();
    for (const a of latest.values()) {
      const sid = a.student_id;
      if (!sid) continue;
      const docId = a.assessment?.doc_id;
      const totalPoints = docId ? (totalPointsByDoc.get(docId) ?? 0) : 0;
      const score = Number(a.total_score ?? 0);
      const pct = totalPoints > 0 ? (score / totalPoints) * 100 : 0;

      const cur = acc.get(sid) ?? { submitted: 0, pctSum: 0 };
      cur.submitted += 1;
      cur.pctSum += pct;
      acc.set(sid, cur);
    }

    return studentIds.map((sid: number) => {
      const cur = acc.get(sid) ?? { submitted: 0, pctSum: 0 };
      const submittedCount = cur.submitted;
      const submittedPct =
        totalAssigned > 0
          ? Math.round((submittedCount / totalAssigned) * 100)
          : 0;
      const avgGradePct =
        submittedCount > 0 ? Math.round(cur.pctSum / submittedCount) : 0;

      return {
        studentId: sid,
        avgGradePct,
        submittedCount,
        totalAssigned,
        submittedPct,
      };
    });
  }

  /**
   * Create a group in a classroom
   */
  async createGroup(
    classId: number,
    userId: number,
    createGroupDto: CreateGroupDto,
  ): Promise<GroupResponseDto> {
    // Verify user is teacher in this classroom
    await this.verifyUserIsTeacher(userId, classId);

    // Check if group with same name already exists in this classroom
    const existingGroup = await this.prisma.class_group.findFirst({
      where: {
        class_id: classId,
        group_name: createGroupDto.groupName,
        is_deleted: false,
      },
    });

    if (existingGroup) {
      throw new BadRequestException(
        `Group with name "${createGroupDto.groupName}" already exists in this classroom`,
      );
    }

    const group = await this.prisma.class_group.create({
      data: {
        class_id: classId,
        group_name: createGroupDto.groupName,
      },
      include: {
        group_student: {
          include: {
            student: {
              include: {
                USER: true,
              },
            },
          },
        },
      },
    });

    return this.mapGroupToResponse(group);
  }

  /**
   * Update a group
   */
  async updateGroup(
    classId: number,
    groupId: number,
    userId: number,
    updateGroupDto: UpdateGroupDto,
  ): Promise<GroupResponseDto> {
    // Verify user is teacher in this classroom
    await this.verifyUserIsTeacher(userId, classId);

    // Verify group exists and belongs to this classroom
    const group = await this.prisma.class_group.findFirst({
      where: {
        group_id: groupId,
        class_id: classId,
      },
    });

    if (!group) {
      throw new NotFoundException('Group not found in this classroom');
    }

    const updatedGroup = await this.prisma.class_group.update({
      where: { group_id: groupId },
      data: {
        ...(updateGroupDto.groupName && {
          group_name: updateGroupDto.groupName,
        }),
      },
      include: {
        group_student: {
          include: {
            student: {
              include: {
                USER: true,
              },
            },
          },
        },
      },
    });

    return this.mapGroupToResponse(updatedGroup);
  }

  /**
   * Delete a group (soft delete)
   */
  async deleteGroup(
    classId: number,
    groupId: number,
    userId: number,
  ): Promise<void> {
    // Verify user is teacher in this classroom
    await this.verifyUserIsTeacher(userId, classId);

    // Verify group exists and belongs to this classroom
    const group = await this.prisma.class_group.findFirst({
      where: {
        group_id: groupId,
        class_id: classId,
      },
    });

    if (!group) {
      throw new NotFoundException('Group not found in this classroom');
    }

    await this.prisma.class_group.update({
      where: { group_id: groupId },
      data: { is_deleted: true },
    });
  }

  /**
   * Assign a student to a group
   * A student can only belong to one group per class
   */
  async assignStudentToGroup(
    classId: number,
    groupId: number,
    userId: number,
    assignStudentToGroupDto: AssignStudentToGroupDto,
  ): Promise<void> {
    // Verify user is teacher in this classroom
    await this.verifyUserIsTeacher(userId, classId);

    const { studentId } = assignStudentToGroupDto;

    // Verify group exists and belongs to this classroom
    const group = await this.prisma.class_group.findFirst({
      where: {
        group_id: groupId,
        class_id: classId,
        is_deleted: false,
      },
    });

    if (!group) {
      throw new NotFoundException('Group not found in this classroom');
    }

    // Verify student is in this classroom
    const student = await this.prisma.class_student.findUnique({
      where: {
        class_id_student_id: {
          class_id: classId,
          student_id: studentId,
        },
      },
    });

    if (!student) {
      throw new NotFoundException('Student not found in this classroom');
    }

    // Check if student is already in another group in this classroom
    const existingGroupStudent = await this.prisma.group_student.findFirst({
      where: {
        student_id: studentId,
        class_group: {
          class_id: classId,
          is_deleted: false,
        },
      },
    });

    // If student is in another group, remove them from that group
    if (existingGroupStudent) {
      await this.prisma.group_student.delete({
        where: {
          group_id_student_id: {
            group_id: existingGroupStudent.group_id,
            student_id: studentId,
          },
        },
      });
    }

    // Add student to the new group
    await this.prisma.group_student.create({
      data: {
        group_id: groupId,
        student_id: studentId,
      },
    });
  }

  /**
   * Remove a student from a group
   */
  async removeStudentFromGroup(
    classId: number,
    groupId: number,
    userId: number,
    studentId: number,
  ): Promise<void> {
    // Verify user is teacher in this classroom
    await this.verifyUserIsTeacher(userId, classId);

    // Verify group exists and belongs to this classroom
    const group = await this.prisma.class_group.findFirst({
      where: {
        group_id: groupId,
        class_id: classId,
      },
    });

    if (!group) {
      throw new NotFoundException('Group not found in this classroom');
    }

    const groupStudent = await this.prisma.group_student.findUnique({
      where: {
        group_id_student_id: {
          group_id: groupId,
          student_id: studentId,
        },
      },
    });

    if (!groupStudent) {
      throw new NotFoundException('Student not found in this group');
    }

    await this.prisma.group_student.delete({
      where: {
        group_id_student_id: {
          group_id: groupId,
          student_id: studentId,
        },
      },
    });
  }

  /**
   * Get all groups in a classroom
   */
  async getClassroomGroups(
    classId: number,
    userId: number,
    paginationDto: PaginationDto,
  ): Promise<{
    data: GroupResponseDto[];
    total: number;
    page: number;
    limit: number;
  }> {
    // Verify user has access to this classroom
    await this.verifyUserAccessToClassroom(userId, classId);

    const { page = 1, limit = 10 } = paginationDto;
    const skip = (page - 1) * limit;

    const [groups, total] = await Promise.all([
      this.prisma.class_group.findMany({
        where: {
          class_id: classId,
          is_deleted: false,
        },
        include: {
          group_student: {
            include: {
              student: {
                include: {
                  USER: true,
                },
              },
            },
          },
        },
        skip,
        take: limit,
        orderBy: { created_at: 'desc' },
      }),
      this.prisma.class_group.count({
        where: {
          class_id: classId,
          is_deleted: false,
        },
      }),
    ]);

    return {
      data: groups.map((group) => this.mapGroupToResponse(group)),
      total,
      page,
      limit,
    };
  }

  /**
   * Get a specific group with all its students
   */
  async getGroup(
    classId: number,
    groupId: number,
    userId: number,
  ): Promise<GroupResponseDto> {
    // Verify user has access to this classroom
    await this.verifyUserAccessToClassroom(userId, classId);

    const group = await this.prisma.class_group.findFirst({
      where: {
        group_id: groupId,
        class_id: classId,
        is_deleted: false,
      },
      include: {
        group_student: {
          include: {
            student: {
              include: {
                USER: true,
              },
            },
          },
        },
      },
    });

    if (!group) {
      throw new NotFoundException('Group not found in this classroom');
    }

    return this.mapGroupToResponse(group);
  }

  // ==================== HELPER METHODS ====================

  /**
   * Verify user has access to the classroom (as teacher or admin)
   */
  private async verifyUserAccessToClassroom(
    userId: number,
    classId: number,
  ): Promise<void> {
    const classroom = await this.prisma.classroom.findFirst({
      where: {
        class_id: classId,
        is_deleted: false,
        OR: [
          { created_by: userId },
          {
            teacher_classroom: {
              some: {
                teacher_id: userId,
              },
            },
          },
          {
            class_student: {
              some: {
                student_id: userId,
              },
            },
          },
        ],
      },
    });

    if (!classroom) {
      throw new ForbiddenException('You do not have access to this classroom');
    }
  }

  /**
   * Verify user is a teacher in the classroom
   */
  private async verifyUserIsTeacher(
    userId: number,
    classId: number,
  ): Promise<void> {
    await this.verifyUserAccessToClassroom(userId, classId);
  }

  /**
   * Verify user is the owner of the classroom
   */
  private async verifyUserIsOwner(
    userId: number,
    classId: number,
  ): Promise<void> {
    const classroom = await this.prisma.classroom.findFirst({
      where: {
        class_id: classId,
        is_deleted: false,
        teacher_classroom: {
          some: {
            teacher_id: userId,
            is_owner: true,
          },
        },
      },
    });

    if (!classroom) {
      throw new ForbiddenException(
        'Only the classroom owner can perform this action',
      );
    }
  }

  /**
   * Join a classroom by code
   * Code is currently the numeric class ID
   */
  async joinClassByCode(
    userId: number,
    joinClassDto: JoinClassDto,
  ): Promise<ClassroomResponseDto> {
    const classId = Number(joinClassDto.classCode);
    if (isNaN(classId)) {
      throw new BadRequestException('Invalid class code');
    }

    const classroom = await this.prisma.classroom.findUnique({
      where: { class_id: classId, is_deleted: false },
      include: {
        subject: true,
        USER: true,
        teacher_classroom: true,
        class_student: true,
        class_group: true,
      },
    });

    if (!classroom) {
      throw new NotFoundException(
        `Classroom with code ${joinClassDto.classCode} not found`,
      );
    }

    // Check if user is already in the classroom
    const existingStudent = await this.prisma.class_student.findUnique({
      where: {
        class_id_student_id: {
          class_id: classId,
          student_id: userId,
        },
      },
    });

    if (existingStudent) {
      throw new BadRequestException(
        'You are already enrolled in this classroom',
      );
    }

    // Check if user is a teacher in this class
    const existingTeacher = await this.prisma.teacher_classroom.findUnique({
      where: {
        teacher_id_class_id: {
          teacher_id: userId,
          class_id: classId,
        },
      },
    });

    if (existingTeacher) {
      throw new BadRequestException(
        'You are already a teacher in this classroom',
      );
    }

    // Verify user has student role/profile
    const studentProfile = await this.prisma.student.findUnique({
      where: { student_id: userId },
    });

    if (!studentProfile) {
      throw new ForbiddenException(
        'Only students can join classrooms using a code',
      );
    }

    // Enroll student
    await this.prisma.class_student.create({
      data: {
        class_id: classId,
        student_id: userId,
      },
    });

    return this.mapClassroomToResponse(classroom, userId);
  }

  /**
   * Map classroom entity to response DTO
   */
  private mapClassroomToResponse(
    classroom: any,
    userId: number,
  ): ClassroomResponseDto {
    const creatorTeacher = classroom.teacher_classroom?.find(
      (tc: any) => tc.is_owner,
    );
    const isOwner = creatorTeacher?.teacher_id === userId;

    return {
      classId: classroom.class_id,
      className: classroom.class_name,
      gradeLevel: classroom.grade_level,
      subjectId: classroom.subject_id,
      subjectName: classroom.subject?.subject_name,
      createdBy: classroom.created_by,
      createdByName: classroom.USER?.user_name,
      createdAt: classroom.created_at?.toISOString(),
      updatedAt: classroom.updated_at?.toISOString(),
      isDeleted: classroom.is_deleted,
      studentCount: classroom.class_student?.length || 0,
      teacherCount: classroom.teacher_classroom?.length || 0,
      groupCount:
        classroom.class_group?.filter((g: any) => !g.is_deleted).length || 0,
      isOwner,
    };
  }

  /**
   * Map student entity to response DTO
   */
  private mapStudentToResponse(
    classStudent: any,
    classId: number,
  ): StudentResponseDto {
    const groupStudent = classStudent.student?.group_student?.[0];

    return {
      studentId: classStudent.student.student_id,
      studentName: classStudent.student.USER.user_name,
      email: classStudent.student.USER.email,
      profilePicture: classStudent.student.USER.profile_picture,
      role: classStudent.student.USER.role,
      credit: classStudent.student.USER.credit,
      isActive: classStudent.student.USER.is_active,
      gradeLevel: classStudent.student.grade_level,
      parentPhone: classStudent.student.parent_phone,
      createdAt: classStudent.student.USER.created_at?.toISOString(),
      joinedAt: classStudent.joined_at?.toISOString(),
      groupId: groupStudent?.group_id,
      groupName: groupStudent?.group?.group_name,
    };
  }

  /**
   * Map group entity to response DTO
   */
  private mapGroupToResponse(group: any): GroupResponseDto {
    return {
      groupId: group.group_id,
      groupName: group.group_name,
      classId: group.class_id,
      createdAt: group.created_at?.toISOString(),
      updatedAt: group.updated_at?.toISOString(),
      studentCount: group.group_student?.length || 0,
      students:
        group.group_student?.map((gs: any) => ({
          studentId: gs.student.student_id,
          studentName: gs.student.USER.user_name,
          email: gs.student.USER.email,
          profilePicture: gs.student.USER.profile_picture,
          role: gs.student.USER.role,
          credit: gs.student.USER.credit,
          isActive: gs.student.USER.is_active,
          gradeLevel: gs.student.grade_level,
          parentPhone: gs.student.parent_phone,
          createdAt: gs.student.USER.created_at?.toISOString(),
        })) || [],
    };
  }
}
