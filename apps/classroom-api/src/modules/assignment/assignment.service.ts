import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { CreateAssignmentDto } from './dtos/create-assignment.dto';
import { UpdateAssignmentDto } from './dtos/update-assignment.dto';

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

    // Create document
    const document = await this.prisma.document.create({
      data: {
        doc_title: dto.title,
        doc_type: 'ASSIGNMENT',
        grade_level: dto.gradeLevel ?? null,
        subject_id: dto.subjectId ?? null,
        note: dto.note ?? null,
        status: 'draft',
        owner_id: userId,
      },
    });

    // Create assessment record to link classroom with assignment
    await this.prisma.assessment.create({
      data: {
        doc_id: document.doc_id,
        class_id: dto.classId,
        assigned_by: userId,
        status: 'draft',
      },
    });

    return {
      message: 'Assignment created successfully',
      data: {
        ...document,
        class_id: dto.classId,
      },
    };
  }

  async getAssignmentById(id: number) {
    const document = await this.prisma.document.findFirst({
      where: {
        doc_id: id,
        doc_type: 'ASSIGNMENT',
      },
      include: {
        assessment: true,
      },
    });

    if (!document) {
      throw new NotFoundException('Assignment not found');
    }

    return document;
  }

  async listAssignments() {
    const documents = await this.prisma.document.findMany({
      where: { doc_type: 'ASSIGNMENT' },
      include: {
        assessment: true,
      },
      orderBy: { updated_at: 'desc' },
    });

    return documents;
  }

  async getAssignmentsByClassroom(classId: number) {
    const assignments = await this.prisma.assessment.findMany({
      where: {
        class_id: classId,
        document: {
          doc_type: 'ASSIGNMENT',
        },
      },
      include: {
        document: true,
      },
      orderBy: { due_date: 'desc' },
    });

    return assignments.map((a) => ({
      ...a.document!,
      class_id: a.class_id,
      assessment_id: a.assessment_id,
    }));
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
        note: dto.note ?? existing.note,
      },
    });

    return { message: 'Assignment updated successfully', data: updatedDoc };
  }

  async deleteAssignment(id: number) {
    const existing = await this.prisma.document.findFirst({
      where: {
        doc_id: id,
        doc_type: 'ASSIGNMENT',
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
}
