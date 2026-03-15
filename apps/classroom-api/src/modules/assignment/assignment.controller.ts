import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/public.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { AssignmentService } from './assignment.service';
import { CreateAssignmentDto } from './dtos/create-assignment.dto';
import {
  UpdateAssignmentDto,
  SubmitAssignmentDto,
  GradeSubmissionDto,
} from './dtos/update-assignment.dto';

@ApiTags('Assignments & Quizzes')
@Controller('assignments')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AssignmentController {
  constructor(private readonly assignmentService: AssignmentService) {}

  /**
   * BASIC CRUD ENDPOINTS
   */

  @Post()
  @Roles('TEACHER')
  @ApiOperation({
    summary: 'Create new assignment/quiz with questions (TEACHER only)',
  })
  @ApiResponse({ status: 201, description: 'Assignment created successfully' })
  create(
    @Body() dto: CreateAssignmentDto,
    @CurrentUser('userId') userId: number,
  ) {
    return this.assignmentService.createAssignment(dto, userId);
  }

  @Get()
  @ApiOperation({
    summary: 'List all assignments - filter by classroom using ?classId=X',
  })
  @ApiResponse({ status: 200, description: 'List of assignments' })
  findAll(@Query('classId') classId?: string) {
    if (classId) {
      return this.assignmentService.getAssignmentsByClassroom(
        parseInt(classId),
      );
    }
    return this.assignmentService.listAssignments();
  }

  @Put(':id')
  @Roles('TEACHER')
  @ApiOperation({ summary: 'Update assignment (TEACHER only)' })
  @ApiResponse({ status: 200, description: 'Assignment updated successfully' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateAssignmentDto,
  ) {
    return this.assignmentService.updateAssignment(id, dto);
  }

  @Delete(':id')
  @Roles('TEACHER')
  @ApiOperation({ summary: 'Delete assignment (TEACHER only)' })
  @ApiResponse({ status: 200, description: 'Assignment deleted successfully' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.assignmentService.deleteAssignment(id);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get assignment detail by ID with questions',
  })
  @ApiResponse({ status: 200, description: 'Assignment detail' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.assignmentService.getAssignmentById(id);
  }

  /**
   * STUDENT SUBMISSION ENDPOINTS
   */

  @Post(':assessmentId/submit')
  @Roles('STUDENT', 'USER')
  @ApiOperation({
    summary: 'Student submits assignment/quiz answers',
  })
  @ApiResponse({ status: 201, description: 'Submission successful' })
  @ApiResponse({ status: 404, description: 'Assignment not found' })
  @ApiResponse({ status: 403, description: 'Not enrolled in class' })
  async submitAssignment(
    @Param('assessmentId', ParseIntPipe) assessmentId: number,
    @Body() dto: SubmitAssignmentDto,
    @CurrentUser('userId') userId: number,
  ) {
    return this.assignmentService.submitAssignment(assessmentId, userId, dto);
  }

  @Get('submissions/:submissionId')
  @Roles('STUDENT', 'USER', 'TEACHER')
  @ApiOperation({
    summary:
      'Get student submission detail (student views own, teacher views any)',
  })
  @ApiResponse({ status: 200, description: 'Submission detail' })
  async getStudentSubmission(
    @Param('submissionId', ParseIntPipe) submissionId: number,
    @CurrentUser('userId') userId: number,
  ) {
    return this.assignmentService.getStudentSubmission(submissionId, userId);
  }

  /**
   * TEACHER SUBMISSION MANAGEMENT ENDPOINTS
   */

  @Get(':assessmentId/submissions')
  @Roles('TEACHER')
  @ApiOperation({
    summary: 'Teacher gets all student submissions for an assignment/quiz',
  })
  @ApiResponse({ status: 200, description: 'List of submissions' })
  async getSubmissions(
    @Param('assessmentId', ParseIntPipe) assessmentId: number,
  ) {
    return this.assignmentService.getSubmissions(assessmentId);
  }

  @Get(':assessmentId/stats')
  @Roles('TEACHER')
  @ApiOperation({
    summary:
      'Get assignment statistics (submission count, average score, highest/lowest)',
  })
  @ApiResponse({ status: 200, description: 'Assignment statistics' })
  async getAssignmentStats(
    @Param('assessmentId', ParseIntPipe) assessmentId: number,
  ) {
    return this.assignmentService.getAssignmentStats(assessmentId);
  }

  @Put('submissions/:submissionId/grade')
  @Roles('TEACHER')
  @ApiOperation({
    summary: 'Teacher grades student submission with score and feedback',
  })
  @ApiResponse({ status: 200, description: 'Submission graded successfully' })
  @ApiResponse({ status: 403, description: 'Not authorized to grade' })
  async gradeSubmission(
    @Param('submissionId', ParseIntPipe) submissionId: number,
    @Body() dto: GradeSubmissionDto,
    @CurrentUser('userId') userId: number,
  ) {
    return this.assignmentService.gradeSubmission(submissionId, userId, dto);
  }
}
