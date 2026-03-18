// import {
//   BadRequestException,
//   Injectable,
//   NotFoundException,
// } from '@nestjs/common';
// import { PrismaService } from '../../infrastructure/prisma/prisma.service';
// import { CreateAssignmentDto } from './dtos/create-assignment.dto';
// import { UpdateAssignmentDto } from './dtos/update-assignment.dto';

// @Injectable()
// export class AssignmentService {
//   constructor(private readonly prisma: PrismaService) {}

//   async createAssignment(dto: CreateAssignmentDto, userId: number) {
//     // Verify classroom exists
//     const classroom = await this.prisma.classroom.findUnique({
//       where: { class_id: dto.classId },
//     });

//     if (!classroom) {
//       throw new BadRequestException(
//         `Classroom with ID ${dto.classId} not found`,
//       );
//     }

//     // Create document
//     const document = await this.prisma.document.create({
//       data: {
//         doc_title: dto.title,
//         doc_type: 'ASSIGNMENT',
//         grade_level: dto.gradeLevel ?? null,
//         subject_id: dto.subjectId ?? null,
//         note: dto.note ?? null,
//         status: 'published',
//         owner_id: userId,
//       },
//     });

//     // Create assessment record to link classroom with assignment
//     await this.prisma.assessment.create({
//       data: {
//         doc_id: document.doc_id,
//         class_id: dto.classId,
//         assigned_by: userId,
//         status: 'published',
//       },
//     });

//     return {
//       message: 'Assignment created successfully',
//       data: this.transformDocumentToAssignment(document),
//     };
//   }

//   async getAssignmentById(id: number) {
//     const document = await this.prisma.document.findFirst({
//       where: {
//         doc_id: id,
//         doc_type: 'ASSIGNMENT',
//       },
//       include: {
//         assessment: true,
//       },
//     });

//     if (!document) {
//       throw new NotFoundException('Assignment not found');
//     }

//     return this.transformDocumentToAssignment(document);
//   }

//   async listAssignments() {
//     const documents = await this.prisma.document.findMany({
//       where: { doc_type: 'ASSIGNMENT' },
//       include: {
//         assessment: true,
//       },
//       orderBy: { updated_at: 'desc' },
//     });

//     return documents.map((doc) => this.transformDocumentToAssignment(doc));
//   }

//   async getAssignmentsByClassroom(classId: number) {
//     // Get all assessments for this classroom with their documents
//     const assessments = await this.prisma.assessment.findMany({
//       where: {
//         class_id: classId,
//       },
//       include: {
//         document: true,
//       },
//     });

//     // Filter to only ASSIGNMENT type documents and return enriched data
//     return assessments
//       .filter((a) => a.document?.doc_type === 'ASSIGNMENT')
//       .sort((a, b) => {
//         // Sort by due_date descending, fallback to updated_at
//         const aDate = a.due_date || a.document?.updated_at || new Date(0);
//         const bDate = b.due_date || b.document?.updated_at || new Date(0);
//         return new Date(bDate).getTime() - new Date(aDate).getTime();
//       })
//       .map((a) => this.transformDocumentToAssignment(a.document!));
//   }

//   private transformDocumentToAssignment(doc: any): any {
//     return {
//       docId: doc.doc_id,
//       docTitle: doc.doc_title,
//       docType: doc.doc_type,
//       gradeLevel: doc.grade_level || null,
//       subjectId: doc.subject_id || null,
//       note: doc.note || null,
//       status: (doc.status || 'draft').toLowerCase(),
//       ownerId: doc.owner_id,
//       createdAt: doc.created_at
//         ? new Date(doc.created_at).toISOString()
//         : new Date().toISOString(),
//       updatedAt: doc.updated_at
//         ? new Date(doc.updated_at).toISOString()
//         : new Date().toISOString(),
//     };
//   }

//   async updateAssignment(id: number, dto: UpdateAssignmentDto) {
//     const existing = await this.prisma.document.findFirst({
//       where: {
//         doc_id: id,
//         doc_type: 'ASSIGNMENT',
//       },
//     });

//     if (!existing) {
//       throw new NotFoundException('Assignment not found');
//     }

//     const updatedDoc = await this.prisma.document.update({
//       where: { doc_id: id },
//       data: {
//         doc_title: dto.title ?? existing.doc_title,
//         grade_level: dto.gradeLevel ?? existing.grade_level,
//         subject_id: dto.subjectId ?? existing.subject_id,
//         note: dto.note ?? existing.note,
//       },
//     });

//     return {
//       message: 'Assignment updated successfully',
//       data: this.transformDocumentToAssignment(updatedDoc),
//     };
//   }

//   async deleteAssignment(id: number) {
//     const existing = await this.prisma.document.findFirst({
//       where: {
//         doc_id: id,
//         doc_type: 'ASSIGNMENT',
//       },
//     });

//     if (!existing) {
//       throw new NotFoundException('Assignment not found');
//     }

//     // Delete assessment records first
//     await this.prisma.assessment.deleteMany({
//       where: { doc_id: id },
//     });

//     // Then delete document
//     await this.prisma.document.delete({
//       where: { doc_id: id },
//     });

//     return { message: 'Assignment deleted successfully' };
//   }
// }
