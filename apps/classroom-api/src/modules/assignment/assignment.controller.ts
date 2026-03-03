import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
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
import { UpdateAssignmentDto } from './dtos/update-assignment.dto';

@ApiTags('Assignments')
@Controller('assignments')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AssignmentController {
  constructor(private readonly assignmentService: AssignmentService) {}

  @Post()
  @Roles('TEACHER')
  @ApiOperation({
    summary: 'Create new assignment (document_type = ASSIGNMENT)',
  })
  @ApiResponse({ status: 201, description: 'Assignment created successfully' })
  create(
    @Body() dto: CreateAssignmentDto,
    @CurrentUser('userId') userId: number,
  ) {
    return this.assignmentService.createAssignment(dto, userId);
  }

  @Get()
  @ApiOperation({ summary: 'List all assignments' })
  @ApiResponse({ status: 200, description: 'List of assignments' })
  findAll() {
    return this.assignmentService.listAssignments();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get assignment detail by id' })
  @ApiResponse({ status: 200, description: 'Assignment detail' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.assignmentService.getAssignmentById(id);
  }

  @Put(':id')
  @Roles('TEACHER')
  @ApiOperation({ summary: 'Update assignment' })
  @ApiResponse({ status: 200, description: 'Assignment updated successfully' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateAssignmentDto,
  ) {
    return this.assignmentService.updateAssignment(id, dto);
  }

  @Delete(':id')
  @Roles('TEACHER')
  @ApiOperation({ summary: 'Delete assignment' })
  @ApiResponse({ status: 200, description: 'Assignment deleted successfully' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.assignmentService.deleteAssignment(id);
  }
}
