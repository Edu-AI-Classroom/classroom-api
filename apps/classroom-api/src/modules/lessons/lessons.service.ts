import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { R2Service } from '../../infrastructure/cloudflare_r2/r2.service';
import { CreateLessonDto } from './dtos/create-lesson.dto';
import { UpdateLessonDto } from './dtos/update-lesson.dto';

@Injectable()
export class LessonsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly r2Service: R2Service,
  ) {}

  private async isTeacherOwnsClass(
    userId: number,
    classId: number,
  ): Promise<boolean> {
    const classroom = await this.prisma.classroom.findFirst({
      where: { class_id: classId, created_by: userId },
    });
    if (classroom) return true;

    const teacherClass = await this.prisma.teacher_classroom.findFirst({
      where: { class_id: classId, teacher_id: userId, is_owner: true },
    });
    return !!teacherClass;
  }

  private async isStudentEnrolled(
    studentId: number,
    classId: number,
  ): Promise<boolean> {
    const enrollment = await this.prisma.class_student.findFirst({
      where: { class_id: classId, student_id: studentId },
    });
    return !!enrollment;
  }

  // 1. TẠO LESSON
  async createLesson(
    user: any,
    dto: CreateLessonDto,
    file?: Express.Multer.File,
  ) {
    const userId = user?.userId || user?.user_id || user?.id;
    if (!userId)
      throw new BadRequestException(
        'Không xác định được ID người dùng từ token',
      );
    if (user.role !== 'TEACHER')
      throw new ForbiddenException('Chỉ giáo viên mới được tạo bài học');

    const classIdNum = Number(dto.classId);
    if (isNaN(classIdNum))
      throw new BadRequestException('ID Lớp học không hợp lệ');

    const ownsClass = await this.isTeacherOwnsClass(userId, classIdNum);
    if (!ownsClass)
      throw new ForbiddenException('Bạn không có quyền quản lý lớp học này');

    let fileUrl: string | undefined = undefined;
    if (file) {
      fileUrl = await this.r2Service.uploadFile(file);
    }

    const lessonStatus = dto.status === 'PUBLISHED' ? 'PUBLISHED' : 'DRAFT';
    const publishedAt = lessonStatus === 'PUBLISHED' ? new Date() : null;

    const lesson = await this.prisma.document.create({
      data: {
        title: dto.title,
        type: 'LESSON',
        status: lessonStatus, // Truyền status từ Frontend
        published_at: publishedAt, // Lưu thời gian publish
        note: fileUrl,
        class_id: classIdNum,
        owner_id: userId,
        subject_id: 1,
        grade_level: 1,
        blocks: {
          create: {
            block_type: 'READING',
            content: { body: dto.content },
            position_order: 1.0,
          },
        },
      },
      include: { blocks: true },
    });

    return this.mapLessonResponse(lesson);
  }

  // 2. XEM DANH SÁCH LESSON
  async listLessons(user: any, classId: number) {
    const userId = user?.userId || user?.user_id || user?.id;
    if (!userId)
      throw new BadRequestException('Không xác định được ID người dùng');
    if (!classId || isNaN(classId))
      throw new BadRequestException('ID Lớp học không hợp lệ');

    if (user.role === 'TEACHER') {
      const ownsClass = await this.isTeacherOwnsClass(userId, classId);
      if (!ownsClass) throw new ForbiddenException('Không có quyền truy cập');
    } else if (user.role === 'STUDENT') {
      const isEnrolled = await this.isStudentEnrolled(userId, classId);
      if (!isEnrolled)
        throw new ForbiddenException('Bạn chưa tham gia lớp học này');
    } else {
      throw new ForbiddenException('Quyền không hợp lệ');
    }

    const lessons = await this.prisma.document.findMany({
      where: {
        type: 'LESSON',
        class_id: classId,
        ...(user.role === 'STUDENT' ? { status: 'PUBLISHED' } : {}),
      },
      include: { blocks: true },
      orderBy: { created_at: 'desc' },
    });

    return lessons.map(this.mapLessonResponse);
  }

  // 3. XEM CHI TIẾT LESSON
  async getLessonById(user: any, id: string) {
    const userId = user?.userId || user?.user_id || user?.id;

    const lesson = await this.prisma.document.findFirst({
      where: { id, type: 'LESSON' },
      include: { blocks: true },
    });

    if (!lesson) throw new NotFoundException('Không tìm thấy bài học');

    if (user.role === 'TEACHER') {
      if (lesson.owner_id !== userId) {
        const ownsClass = await this.isTeacherOwnsClass(
          userId,
          lesson.class_id!,
        );
        if (!ownsClass)
          throw new ForbiddenException('Bạn không quản lý lớp học này');
      }
    } else if (user.role === 'STUDENT') {
      if (lesson.status !== 'PUBLISHED')
        throw new ForbiddenException('Bài học chưa được xuất bản');
      const isEnrolled = await this.isStudentEnrolled(userId, lesson.class_id!);
      if (!isEnrolled)
        throw new ForbiddenException('Bạn chưa tham gia lớp học này');
    }

    return this.mapLessonResponse(lesson);
  }

  // 4. CẬP NHẬT LESSON
  async updateLesson(
    user: any,
    id: string,
    dto: UpdateLessonDto,
    file?: Express.Multer.File,
  ) {
    const userId = user?.userId || user?.user_id || user?.id;

    if (user.role !== 'TEACHER')
      throw new ForbiddenException('Chỉ giáo viên mới được cập nhật');

    const existingLesson = await this.prisma.document.findFirst({
      where: { id, type: 'LESSON' },
      include: { blocks: true },
    });

    if (!existingLesson) throw new NotFoundException('Không tìm thấy bài học');
    if (existingLesson.owner_id !== userId)
      throw new ForbiddenException('Bạn không có quyền cập nhật bài học này');

    if (existingLesson.status === 'PUBLISHED') {
      throw new BadRequestException(
        'Bài học đã xuất bản (PUBLISHED) không thể chỉnh sửa.',
      );
    }

    let fileUrl = existingLesson.note;
    if (file) {
      fileUrl = await this.r2Service.uploadFile(file);
    }

    const newStatus = dto.status === 'PUBLISHED' ? 'PUBLISHED' : 'DRAFT';
    const publishedAt = newStatus === 'PUBLISHED' ? new Date() : null;

    const updatedLesson = await this.prisma.document.update({
      where: { id },
      data: {
        title: dto.title || existingLesson.title,
        note: fileUrl,
        status: newStatus,
        ...(publishedAt && { published_at: publishedAt }),
        ...(dto.content && {
          blocks: {
            deleteMany: {},
            create: {
              block_type: 'READING',
              content: { body: dto.content },
              position_order: 1.0,
            },
          },
        }),
      },
      include: { blocks: true },
    });

    return this.mapLessonResponse(updatedLesson);
  }

  // 5. XÓA LESSON
  async deleteLesson(user: any, id: string) {
    const userId = user?.userId || user?.user_id || user?.id;

    if (user.role !== 'TEACHER')
      throw new ForbiddenException('Chỉ giáo viên mới được xóa');

    const existingLesson = await this.prisma.document.findFirst({
      where: { id, type: 'LESSON' },
    });

    if (!existingLesson) throw new NotFoundException('Không tìm thấy bài học');
    if (existingLesson.owner_id !== userId)
      throw new ForbiddenException('Bạn không có quyền xóa');

    await this.prisma.document.delete({
      where: { id },
    });

    return { message: 'Đã xóa bài học thành công' };
  }

  // Helper để map dữ liệu
  private mapLessonResponse = (lesson: any) => {
    const contentData =
      lesson.blocks && lesson.blocks.length > 0
        ? (lesson.blocks[0].content as any)?.body
        : null;

    return {
      id: lesson.id,
      title: lesson.title,
      content: contentData,
      fileUrl: lesson.note,
      classId: lesson.class_id,
      status: lesson.status,
      createdAt: lesson.created_at,
    };
  };
}
