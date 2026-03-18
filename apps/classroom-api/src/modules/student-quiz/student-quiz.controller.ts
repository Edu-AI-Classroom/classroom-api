import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
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
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/public.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { SubmitQuizDto } from './dtos/submit-quiz.dto';
import { StudentQuizService } from './student-quiz.service';

@ApiTags('Student Quiz')
@Controller('student/quizzes')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
export class StudentQuizController {
  constructor(private readonly studentQuizService: StudentQuizService) {}

  @Get()
  @Roles('STUDENT')
  @ApiOperation({ summary: 'List quizzes assigned to a classroom' })
  list(
    @CurrentUser('userId') userId: number,
    @Query('classId') classId?: string,
  ) {
    return this.studentQuizService.listAssignedQuizzes(
      userId,
      classId ? Number(classId) : undefined,
    );
  }

  @Get(':quizId')
  @Roles('STUDENT')
  @ApiOperation({ summary: 'Get quiz detail for student' })
  @ApiParam({ name: 'quizId', example: 'uuid' })
  getDetail(
    @CurrentUser('userId') userId: number,
    @Param('quizId') quizId: string,
  ) {
    return this.studentQuizService.getQuizDetail(userId, quizId);
  }

  @Get(':quizId/questions')
  @Roles('STUDENT')
  @ApiOperation({ summary: 'Get quiz questions for student (no answers)' })
  @ApiParam({ name: 'quizId', example: 'uuid' })
  getQuestions(
    @CurrentUser('userId') userId: number,
    @Param('quizId') quizId: string,
  ) {
    return this.studentQuizService.getQuizQuestions(userId, quizId);
  }

  @Post(':quizId/attempts/start')
  @Roles('STUDENT')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Start a new attempt for a quiz' })
  startAttempt(
    @CurrentUser('userId') userId: number,
    @Param('quizId') quizId: string,
  ) {
    return this.studentQuizService.startAttempt(userId, quizId);
  }

  @Post(':quizId/attempts/:attemptId/submit')
  @Roles('STUDENT')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Submit answers for an attempt' })
  @ApiResponse({ status: 200 })
  submitAttempt(
    @CurrentUser('userId') userId: number,
    @Param('quizId') quizId: string,
    @Param('attemptId') attemptId: string,
    @Body() dto: SubmitQuizDto,
  ) {
    return this.studentQuizService.submitAttempt(
      userId,
      quizId,
      Number(attemptId),
      dto,
    );
  }
}
