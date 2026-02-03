import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { CreateLessonDto } from './dtos/create-lesson.dto';
import { UpdateLessonDto } from './dtos/update-lesson.dto';

@Injectable()
export class LessonsService {
  constructor(private readonly prisma: PrismaService) {}

  async createLesson(dto: CreateLessonDto) {
    const prisma = this.prisma as any;

    const document = await prisma.document.create({
      data: {
        doc_title: dto.title,
        doc_type: 'Lesson',
        grade_level: dto.gradeLevel ?? null,
        subject_id: dto.subjectId ?? null,
        note: dto.note ?? null,
        page_setting: dto.canvas.settings
          ? JSON.stringify(dto.canvas.settings)
          : null,
        status: 'draft',
        owner_id: dto.ownerId,
      },
    });

    const version = await prisma.document_version.create({
      data: {
        doc_id: document.doc_id,
        settings: JSON.stringify(dto.canvas),
      },
    });

    await prisma.document.update({
      where: { doc_id: document.doc_id },
      data: { current_ver_id: version.ver_id },
    });

    return {
      message: 'Lesson created successfully',
      data: this.mapToLessonDetail(document, version),
    };
  }

  async getLessonById(id: number) {
    const prisma = this.prisma as any;

    const document = await prisma.document.findFirst({
      where: {
        doc_id: id,
        doc_type: 'Lesson',
      },
      include: {
        document_version_document_current_ver_idTodocument_version: true,
      },
    });

    if (!document) {
      throw new NotFoundException('Lesson not found');
    }

    const version =
      document.document_version_document_current_ver_idTodocument_version;

    return this.mapToLessonDetail(document, version);
  }

  async listLessons() {
    const prisma = this.prisma as any;

    const documents = await prisma.document.findMany({
      where: { doc_type: 'Lesson' },
      orderBy: { updated_at: 'desc' },
      include: {
        document_version_document_current_ver_idTodocument_version: true,
      },
    });

    return documents.map((doc) =>
      this.mapToLessonDetail(
        doc,
        doc.document_version_document_current_ver_idTodocument_version,
      ),
    );
  }

  async updateLesson(id: number, dto: UpdateLessonDto) {
    const prisma = this.prisma as any;

    const existing = await prisma.document.findFirst({
      where: {
        doc_id: id,
        doc_type: 'Lesson',
      },
      include: {
        document_version_document_current_ver_idTodocument_version: true,
      },
    });

    if (!existing) {
      throw new NotFoundException('Lesson not found');
    }

    const version =
      existing.document_version_document_current_ver_idTodocument_version;

    const updatedDoc = await prisma.document.update({
      where: { doc_id: id },
      data: {
        doc_title: dto.title ?? existing.doc_title,
        grade_level: dto.gradeLevel ?? existing.grade_level,
        subject_id: dto.subjectId ?? existing.subject_id,
        note: dto.note ?? existing.note,
        page_setting:
          dto.canvas?.settings != null
            ? JSON.stringify(dto.canvas.settings)
            : existing.page_setting,
        owner_id: dto.ownerId ?? existing.owner_id,
      },
    });

    const updatedVersion = await prisma.document_version.update({
      where: { ver_id: version.ver_id },
      data: dto.canvas
        ? {
            settings: JSON.stringify(dto.canvas),
          }
        : {},
    });

    return {
      message: 'Lesson updated successfully',
      data: this.mapToLessonDetail(updatedDoc, updatedVersion),
    };
  }

  async deleteLesson(id: number) {
    const prisma = this.prisma as any;

    const existing = await prisma.document.findFirst({
      where: {
        doc_id: id,
        doc_type: 'Lesson',
      },
    });

    if (!existing) {
      throw new NotFoundException('Lesson not found');
    }

    // Gỡ liên kết current_ver_id trước để tránh lỗi FK fk_doc_current_version
    await prisma.document.update({
      where: { doc_id: id },
      data: { current_ver_id: null },
    });

    // Xóa các version của document trước để tránh lỗi foreign key từ document_version lên các bảng khác
    await prisma.document_version.deleteMany({
      where: { doc_id: id },
    });

    await prisma.document.delete({
      where: { doc_id: id },
    });

    return { message: 'Lesson deleted successfully' };
  }

  private mapToLessonDetail(document: any, version: any) {
    let canvas: unknown = null;
    let pageSettings: unknown = null;

    try {
      canvas = version?.settings ? JSON.parse(version.settings) : null;
    } catch {
      canvas = null;
    }

    try {
      pageSettings = document?.page_setting
        ? JSON.parse(document.page_setting)
        : null;
    } catch {
      pageSettings = null;
    }

    return {
      id: document.doc_id,
      title: document.doc_title,
      type: document.doc_type,
      gradeLevel: document.grade_level,
      subjectId: document.subject_id,
      note: document.note,
      status: document.status,
      ownerId: document.owner_id,
      updatedAt: document.updated_at,
      currentVersionId: document.current_ver_id,
      pageSettings,
      canvas,
    };
  }
}
