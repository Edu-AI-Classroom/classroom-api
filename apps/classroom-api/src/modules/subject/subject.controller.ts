import { Controller, Get, HttpStatus, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import { ApiResponseDto } from '../../common/dto/api-response.dto';
import { Roles } from '../auth/decorators/public.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { SubjectResponseDto } from './dto/subject-response.dto';
import { SubjectService } from './subject.service';

@ApiTags('Subjects')
@ApiBearerAuth('JWT-auth')
@Controller('subjects')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SubjectController {
  constructor(private readonly subjectService: SubjectService) {}

  @Get()
  @Roles('TEACHER', 'STUDENT', 'ADMIN')
  @ApiOperation({ summary: 'Get all subjects' })
  @ApiResponse({
    status: 200,
    description: 'List of subjects',
    type: ApiResponseDto,
  })
  async findAll(): Promise<ApiResponseDto<SubjectResponseDto[]>> {
    const subjects = await this.subjectService.findAll();

    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Subjects retrieved successfully',
      data: subjects,
      path: '/subjects',
      timestamp: new Date().toISOString(),
    };
  }
}
