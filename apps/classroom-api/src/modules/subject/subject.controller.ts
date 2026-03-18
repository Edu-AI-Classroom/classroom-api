import { Controller, Get, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { ApiResponseDto } from '../../common/dto/api-response.dto';
import { Public } from '../auth/decorators/public.decorator';
import { SubjectResponseDto } from './dto/subject-response.dto';
import { SubjectService } from './subject.service';

@ApiTags('Subjects')
@Controller('subjects')
export class SubjectController {
  constructor(private readonly subjectService: SubjectService) {}

  @Get()
  @Public()
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
