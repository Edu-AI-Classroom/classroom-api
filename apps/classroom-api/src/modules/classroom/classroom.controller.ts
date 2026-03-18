import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { ApiResponseDto } from '../../common/dto/api-response.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/public.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { ClassroomService } from './classroom.service';
import {
  AddStudentDto,
  AddTeacherDto,
  AssignStudentToGroupDto,
  ClassroomResponseDto,
  CreateClassroomDto,
  CreateGroupDto,
  GroupResponseDto,
  StudentResponseDto,
  TeacherResponseDto,
  UpdateClassroomDto,
  UpdateGroupDto,
} from './dtos';

// Mock decorator for authentication - replace with actual auth guard
// In production, use @UseGuards(AuthGuard('jwt')) and @CurrentUser()

@ApiTags('Classrooms')
@Controller('classrooms')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ClassroomController {
  constructor(private readonly classroomService: ClassroomService) {}

  // ==================== CLASSROOM CRUD ====================

  @Post()
  @Roles('TEACHER', 'ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create a new classroom',
    description: `
Create a new classroom. The authenticated teacher becomes the owner of this classroom.
Only teachers can create classrooms.

The owner has full permissions:
- Add/remove students
- Add/remove teachers
- Create/delete groups
- Edit class information
- Delete the classroom
    `,
  })
  @ApiResponse({
    status: 201,
    description: 'Classroom created successfully',
    type: ApiResponseDto,
  })
  async createClassroom(
    @Body() createClassroomDto: CreateClassroomDto,
    @CurrentUser('userId') userId: number,
  ): Promise<ApiResponseDto<ClassroomResponseDto>> {
    const classroom = await this.classroomService.createClassroom(
      userId,
      createClassroomDto,
    );
    return {
      success: true,
      statusCode: HttpStatus.CREATED,
      message: 'Classroom created successfully',
      data: classroom,
      path: '/classrooms',
      timestamp: new Date().toISOString(),
    };
  }

  @Get(':classId')
  @Roles('TEACHER', 'STUDENT')
  @ApiOperation({
    summary: 'Get classroom details',
    description: 'Retrieve detailed information about a specific classroom.',
  })
  @ApiParam({
    name: 'classId',
    description: 'The ID of the classroom',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Classroom retrieved successfully',
    type: ApiResponseDto,
  })
  async getClassroom(
    @Param('classId') classId: number,
    @CurrentUser('userId') userId: number,
  ): Promise<ApiResponseDto<ClassroomResponseDto>> {
    const classroom = await this.classroomService.getClassroom(classId, userId);
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Classroom retrieved successfully',
      data: classroom,
      path: `/classrooms/${classId}`,
      timestamp: new Date().toISOString(),
    };
  }

  @Get()
  @Roles('TEACHER', 'STUDENT')
  @ApiOperation({
    summary: 'List my classrooms',
    description: `
Get all classrooms where the authenticated user is a teacher.
This includes:
- Classrooms created by the user (as owner)
- Classrooms where the user was added as a teacher

Results are paginated and sorted by creation date (newest first).
    `,
  })
  @ApiResponse({
    status: 200,
    description: 'Classrooms retrieved successfully',
  })
  async getMyClassrooms(
    @Query() paginationDto: PaginationDto,
    @CurrentUser('userId') userId: number,
  ): Promise<
    ApiResponseDto<{
      data: ClassroomResponseDto[];
      total: number;
      page: number;
      limit: number;
    }>
  > {
    const result = await this.classroomService.getMyClassrooms(
      userId,
      paginationDto,
    );
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Classrooms retrieved successfully',
      data: result,
      path: '/classrooms',
      timestamp: new Date().toISOString(),
    };
  }

  @Put(':classId')
  @Roles('TEACHER')
  @ApiOperation({
    summary: 'Update classroom information',
    description: `
Update classroom details like name, grade level, or subject.
Any teacher in the classroom can update this information.
    `,
  })
  @ApiParam({
    name: 'classId',
    description: 'The ID of the classroom',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Classroom updated successfully',
    type: ApiResponseDto,
  })
  async updateClassroom(
    @Param('classId') classId: number,
    @Body() updateClassroomDto: UpdateClassroomDto,
    @CurrentUser('userId') userId: number,
  ): Promise<ApiResponseDto<ClassroomResponseDto>> {
    const classroom = await this.classroomService.updateClassroom(
      classId,
      userId,
      updateClassroomDto,
    );
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Classroom updated successfully',
      data: classroom,
      path: `/classrooms/${classId}`,
      timestamp: new Date().toISOString(),
    };
  }

  @Delete(':classId')
  @Roles('TEACHER')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete a classroom',
    description: `
Soft delete a classroom. Only the classroom owner can delete it.
The classroom data is preserved in the database but marked as deleted.
    `,
  })
  @ApiParam({
    name: 'classId',
    description: 'The ID of the classroom',
    example: 1,
  })
  @ApiResponse({
    status: 204,
    description: 'Classroom deleted successfully',
  })
  async deleteClassroom(
    @Param('classId') classId: number,
    @CurrentUser('userId') userId: number,
  ): Promise<void> {
    await this.classroomService.deleteClassroom(classId, userId);
  }

  // ==================== TEACHER MANAGEMENT ====================

  @Post(':classId/teachers')
  @Roles('TEACHER')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Add a teacher to the classroom',
    description: `
Add another teacher to the classroom by their email.
Only the classroom owner can add new teachers.

Added teachers will have full permissions:
- Add/remove students
- Add/remove other teachers (if permissions allow)
- Create/delete groups
- Edit class information
    `,
  })
  @ApiParam({
    name: 'classId',
    description: 'The ID of the classroom',
    example: 1,
  })
  @ApiResponse({
    status: 201,
    description: 'Teacher added successfully',
    type: ApiResponseDto,
  })
  async addTeacher(
    @Param('classId') classId: number,
    @Body() addTeacherDto: AddTeacherDto,
    @CurrentUser('userId') userId: number,
  ): Promise<ApiResponseDto<TeacherResponseDto>> {
    const teacher = await this.classroomService.addTeacher(
      classId,
      userId,
      addTeacherDto,
    );
    return {
      success: true,
      statusCode: HttpStatus.CREATED,
      message: 'Teacher added successfully',
      data: teacher,
      path: `/classrooms/${classId}/teachers`,
      timestamp: new Date().toISOString(),
    };
  }

  @Delete(':classId/teachers/:teacherId')
  @Roles('TEACHER')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Remove a teacher from the classroom',
    description: `
Remove a teacher from the classroom.
Only the classroom owner can remove teachers.
The owner cannot remove themselves.
    `,
  })
  @ApiParam({
    name: 'classId',
    description: 'The ID of the classroom',
    example: 1,
  })
  @ApiParam({
    name: 'teacherId',
    description: 'The ID of the teacher to remove',
    example: 2,
  })
  @ApiResponse({
    status: 204,
    description: 'Teacher removed successfully',
  })
  async removeTeacher(
    @Param('classId') classId: number,
    @Param('teacherId') teacherId: number,
    @CurrentUser('userId') userId: number,
  ): Promise<void> {
    await this.classroomService.removeTeacher(classId, userId, teacherId);
  }

  @Get(':classId/teachers')
  @Roles('TEACHER')
  @ApiOperation({
    summary: 'Get all teachers in the classroom',
    description:
      'Retrieve a list of all teachers assigned to a specific classroom.',
  })
  @ApiParam({
    name: 'classId',
    description: 'The ID of the classroom',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Teachers retrieved successfully',
    type: ApiResponseDto,
  })
  async getTeachers(
    @Param('classId') classId: number,
    @CurrentUser('userId') userId: number,
  ): Promise<ApiResponseDto<TeacherResponseDto[]>> {
    const teachers = await this.classroomService.getClassroomTeachers(
      classId,
      userId,
    );
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Teachers retrieved successfully',
      data: teachers,
      path: `/classrooms/${classId}/teachers`,
      timestamp: new Date().toISOString(),
    };
  }

  // ==================== STUDENT MANAGEMENT ====================

  @Post(':classId/students')
  @Roles('TEACHER')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Add a student to the classroom',
    description: `
Add an existing student to the classroom by their email.

The student must already exist in the system with a student profile.
Only teachers in the classroom can add students.
    `,
  })
  @ApiParam({
    name: 'classId',
    description: 'The ID of the classroom',
    example: 1,
  })
  @ApiResponse({
    status: 201,
    description: 'Student added successfully',
    type: ApiResponseDto,
  })
  async addStudent(
    @Param('classId') classId: number,
    @Body() addStudentDto: AddStudentDto,
    @CurrentUser('userId') userId: number,
  ): Promise<ApiResponseDto<StudentResponseDto>> {
    const student = await this.classroomService.addStudent(
      classId,
      userId,
      addStudentDto,
    );
    return {
      success: true,
      statusCode: HttpStatus.CREATED,
      message: 'Student added successfully',
      data: student,
      path: `/classrooms/${classId}/students`,
      timestamp: new Date().toISOString(),
    };
  }

  @Delete(':classId/students/:studentId')
  @Roles('TEACHER')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Remove a student from the classroom',
    description: `
Remove a student from the classroom.
Any teacher in the classroom can remove students.

If the student is in a group, they will be automatically removed from that group.
    `,
  })
  @ApiParam({
    name: 'classId',
    description: 'The ID of the classroom',
    example: 1,
  })
  @ApiParam({
    name: 'studentId',
    description: 'The ID of the student to remove',
    example: 5,
  })
  @ApiResponse({
    status: 204,
    description: 'Student removed successfully',
  })
  async removeStudent(
    @Param('classId') classId: number,
    @Param('studentId') studentId: number,
    @CurrentUser('userId') userId: number,
  ): Promise<void> {
    await this.classroomService.removeStudent(classId, userId, studentId);
  }

  @Get(':classId/students')
  @Roles('TEACHER')
  @ApiOperation({
    summary: 'Get all students in the classroom',
    description: `
Retrieve a paginated list of all students in a specific classroom.
Results include current group assignment if any.
    `,
  })
  @ApiParam({
    name: 'classId',
    description: 'The ID of the classroom',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Students retrieved successfully',
  })
  async getStudents(
    @Param('classId') classId: number,
    @Query() paginationDto: PaginationDto,
    @CurrentUser('userId') userId: number,
  ): Promise<
    ApiResponseDto<{
      data: StudentResponseDto[];
      total: number;
      page: number;
      limit: number;
    }>
  > {
    const result = await this.classroomService.getClassroomStudents(
      classId,
      userId,
      paginationDto,
    );
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Students retrieved successfully',
      data: result,
      path: `/classrooms/${classId}/students`,
      timestamp: new Date().toISOString(),
    };
  }

  // ==================== GROUP MANAGEMENT ====================

  @Post(':classId/groups')
  @Roles('TEACHER')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create a group in the classroom',
    description: `
Create a new group within a specific classroom.
Any teacher in the classroom can create groups.

Group names must be unique within a classroom.
    `,
  })
  @ApiParam({
    name: 'classId',
    description: 'The ID of the classroom',
    example: 1,
  })
  @ApiResponse({
    status: 201,
    description: 'Group created successfully',
    type: ApiResponseDto,
  })
  async createGroup(
    @Param('classId') classId: number,
    @Body() createGroupDto: CreateGroupDto,
    @CurrentUser('userId') userId: number,
  ): Promise<ApiResponseDto<GroupResponseDto>> {
    const group = await this.classroomService.createGroup(
      classId,
      userId,
      createGroupDto,
    );
    return {
      success: true,
      statusCode: HttpStatus.CREATED,
      message: 'Group created successfully',
      data: group,
      path: `/classrooms/${classId}/groups`,
      timestamp: new Date().toISOString(),
    };
  }

  @Put(':classId/groups/:groupId')
  @Roles('TEACHER')
  @ApiOperation({
    summary: 'Update a group',
    description:
      'Update group information (name). Any teacher in the classroom can update groups.',
  })
  @ApiParam({
    name: 'classId',
    description: 'The ID of the classroom',
    example: 1,
  })
  @ApiParam({
    name: 'groupId',
    description: 'The ID of the group',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Group updated successfully',
    type: ApiResponseDto,
  })
  async updateGroup(
    @Param('classId') classId: number,
    @Param('groupId') groupId: number,
    @Body() updateGroupDto: UpdateGroupDto,
    @CurrentUser('userId') userId: number,
  ): Promise<ApiResponseDto<GroupResponseDto>> {
    const group = await this.classroomService.updateGroup(
      classId,
      groupId,
      userId,
      updateGroupDto,
    );
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Group updated successfully',
      data: group,
      path: `/classrooms/${classId}/groups/${groupId}`,
      timestamp: new Date().toISOString(),
    };
  }

  @Delete(':classId/groups/:groupId')
  @Roles('TEACHER')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete a group',
    description: `
Soft delete a group. Any teacher in the classroom can delete groups.
Students in the group will not be removed from the classroom, only from the group.
    `,
  })
  @ApiParam({
    name: 'classId',
    description: 'The ID of the classroom',
    example: 1,
  })
  @ApiParam({
    name: 'groupId',
    description: 'The ID of the group',
    example: 1,
  })
  @ApiResponse({
    status: 204,
    description: 'Group deleted successfully',
  })
  async deleteGroup(
    @Param('classId') classId: number,
    @Param('groupId') groupId: number,
    @CurrentUser('userId') userId: number,
  ): Promise<void> {
    await this.classroomService.deleteGroup(classId, groupId, userId);
  }

  @Get(':classId/groups')
  @Roles('TEACHER')
  @ApiOperation({
    summary: 'Get all groups in the classroom',
    description: `
Retrieve a paginated list of all groups in a specific classroom.
Results include student count and member list for each group.
    `,
  })
  @ApiParam({
    name: 'classId',
    description: 'The ID of the classroom',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Groups retrieved successfully',
  })
  async getGroups(
    @Param('classId') classId: number,
    @Query() paginationDto: PaginationDto,
    @CurrentUser('userId') userId: number,
  ): Promise<
    ApiResponseDto<{
      data: GroupResponseDto[];
      total: number;
      page: number;
      limit: number;
    }>
  > {
    const result = await this.classroomService.getClassroomGroups(
      classId,
      userId,
      paginationDto,
    );
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Groups retrieved successfully',
      data: result,
      path: `/classrooms/${classId}/groups`,
      timestamp: new Date().toISOString(),
    };
  }

  @Get(':classId/groups/:groupId')
  @Roles('TEACHER')
  @ApiOperation({
    summary: 'Get a specific group with all students',
    description:
      'Retrieve detailed information about a specific group including all students.',
  })
  @ApiParam({
    name: 'classId',
    description: 'The ID of the classroom',
    example: 1,
  })
  @ApiParam({
    name: 'groupId',
    description: 'The ID of the group',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Group retrieved successfully',
    type: ApiResponseDto,
  })
  async getGroup(
    @Param('classId') classId: number,
    @Param('groupId') groupId: number,
    @CurrentUser('userId') userId: number,
  ): Promise<ApiResponseDto<GroupResponseDto>> {
    const group = await this.classroomService.getGroup(
      classId,
      groupId,
      userId,
    );
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Group retrieved successfully',
      data: group,
      path: `/classrooms/${classId}/groups/${groupId}`,
      timestamp: new Date().toISOString(),
    };
  }

  @Post(':classId/groups/:groupId/students')
  @Roles('TEACHER')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Assign a student to a group',
    description: `
Assign a student to a group within the classroom.
A student can only belong to ONE group per classroom.

If the student is already in another group, they will be automatically moved to this group.
Any teacher in the classroom can assign students to groups.
    `,
  })
  @ApiParam({
    name: 'classId',
    description: 'The ID of the classroom',
    example: 1,
  })
  @ApiParam({
    name: 'groupId',
    description: 'The ID of the group',
    example: 1,
  })
  @ApiResponse({
    status: 201,
    description: 'Student assigned to group successfully',
  })
  async assignStudentToGroup(
    @Param('classId') classId: number,
    @Param('groupId') groupId: number,
    @Body() assignStudentToGroupDto: AssignStudentToGroupDto,
    @CurrentUser('userId') userId: number,
  ): Promise<ApiResponseDto<null>> {
    await this.classroomService.assignStudentToGroup(
      classId,
      groupId,
      userId,
      assignStudentToGroupDto,
    );
    return {
      success: true,
      statusCode: HttpStatus.CREATED,
      message: 'Student assigned to group successfully',
      path: `/classrooms/${classId}/groups/${groupId}`,
      timestamp: new Date().toISOString(),
    };
  }

  @Delete(':classId/groups/:groupId/students/:studentId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles('TEACHER')
  @ApiOperation({
    summary: 'Remove a student from a group',
    description: `
Remove a student from a group.
The student will remain in the classroom but no longer belongs to any group.
Any teacher in the classroom can remove students from groups.
    `,
  })
  @ApiParam({
    name: 'classId',
    description: 'The ID of the classroom',
    example: 1,
  })
  @ApiParam({
    name: 'groupId',
    description: 'The ID of the group',
    example: 1,
  })
  @ApiParam({
    name: 'studentId',
    description: 'The ID of the student to remove',
    example: 5,
  })
  @ApiResponse({
    status: 204,
    description: 'Student removed from group successfully',
  })
  async removeStudentFromGroup(
    @Param('classId') classId: number,
    @Param('groupId') groupId: number,
    @Param('studentId') studentId: number,
    @CurrentUser('userId') userId: number,
  ): Promise<void> {
    await this.classroomService.removeStudentFromGroup(
      classId,
      groupId,
      userId,
      studentId,
    );
  }
}
