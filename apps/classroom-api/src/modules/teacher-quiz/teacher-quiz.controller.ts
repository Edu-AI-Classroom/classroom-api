import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
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
import { RolesGuard } from '../auth/guards/roles.guard';
import { CreateQuestionDto } from './dtos/create-question.dto';
import { CreateQuizDto } from './dtos/create-quiz.dto';
import { ReorderQuestionsDto } from './dtos/reorder-questions.dto';
import { UpdateQuestionDto } from './dtos/update-question.dto';
import { UpdateQuizDto } from './dtos/update-quiz.dto';
import { TeacherQuizService } from './teacher-quiz.service';

@ApiTags('Teacher Quiz Management')
@Controller('teacher/quizzes')
@ApiBearerAuth('JWT-auth')
@UseGuards(RolesGuard)
export class TeacherQuizController {
  constructor(private readonly quizService: TeacherQuizService) {}

  @Get('overview')
  @Roles('TEACHER')
  @ApiOperation({ summary: 'Quiz overview cards for teacher' })
  getOverview(@CurrentUser('userId') userId: number) {
    return this.quizService.getOverview(userId);
  }

  @Get()
  @Roles('TEACHER')
  @ApiOperation({ summary: 'List quizzes created by teacher' })
  list(
    @CurrentUser('userId') userId: number,
    @Query('search') search?: string,
    @Query('classId') classId?: string,
    @Query('type') type?: 'ASSIGNMENT' | 'EXAM',
  ) {
    return this.quizService.listQuizzes(userId, {
      search,
      classId: classId ? Number(classId) : undefined,
      type,
    });
  }

  @Post()
  @Roles('TEACHER')
  @ApiOperation({ summary: 'Create quiz (ASSIGNMENT or EXAM document)' })
  create(@CurrentUser('userId') userId: number, @Body() dto: CreateQuizDto) {
    return this.quizService.createQuiz(userId, dto);
  }

  @Get(':quizId')
  @Roles('TEACHER')
  @ApiOperation({ summary: 'Get quiz detail' })
  getDetail(
    @CurrentUser('userId') userId: number,
    @Param('quizId') quizId: string,
  ) {
    return this.quizService.getQuizDetail(userId, quizId);
  }

  @Put(':quizId')
  @Roles('TEACHER')
  @ApiOperation({ summary: 'Update quiz' })
  update(
    @CurrentUser('userId') userId: number,
    @Param('quizId') quizId: string,
    @Body() dto: UpdateQuizDto,
  ) {
    return this.quizService.updateQuiz(userId, quizId, dto);
  }

  @Delete(':quizId')
  @Roles('TEACHER')
  @ApiOperation({ summary: 'Delete quiz' })
  delete(
    @CurrentUser('userId') userId: number,
    @Param('quizId') quizId: string,
  ) {
    return this.quizService.deleteQuiz(userId, quizId);
  }

  @Get(':quizId/questions')
  @Roles('TEACHER')
  @ApiOperation({ summary: 'List questions for a quiz' })
  getQuestions(
    @CurrentUser('userId') userId: number,
    @Param('quizId') quizId: string,
  ) {
    return this.quizService.getQuizQuestions(userId, quizId);
  }

  @Put(':quizId/questions/reorder')
  @Roles('TEACHER')
  @ApiOperation({ summary: 'Reorder questions for a quiz' })
  reorderQuestions(
    @CurrentUser('userId') userId: number,
    @Param('quizId') quizId: string,
    @Body() dto: ReorderQuestionsDto,
  ) {
    return this.quizService.reorderQuestions(userId, quizId, dto);
  }

  @Get(':quizId/submissions')
  @Roles('TEACHER')
  @ApiOperation({ summary: 'Submissions overview (stats + charts) for a quiz' })
  submissions(
    @CurrentUser('userId') userId: number,
    @Param('quizId') quizId: string,
  ) {
    return this.quizService.getSubmissionsOverview(userId, quizId);
  }
}

@ApiTags('Teacher Quiz Questions')
@Controller('teacher/questions')
@ApiBearerAuth('JWT-auth')
@UseGuards(RolesGuard)
export class TeacherQuestionController {
  constructor(private readonly quizService: TeacherQuizService) {}

  @Post()
  @Roles('TEACHER')
  @ApiOperation({ summary: 'Create a question for a quiz' })
  @ApiResponse({ status: 201 })
  create(
    @CurrentUser('userId') userId: number,
    @Body() dto: CreateQuestionDto,
  ) {
    return this.quizService.createQuestion(userId, dto);
  }

  @Put(':questionId')
  @Roles('TEACHER')
  @ApiOperation({ summary: 'Update a question' })
  update(
    @CurrentUser('userId') userId: number,
    @Param('questionId') questionId: string,
    @Body() dto: UpdateQuestionDto,
  ) {
    return this.quizService.updateQuestion(userId, questionId, dto);
  }

  @Delete(':questionId')
  @Roles('TEACHER')
  @ApiOperation({ summary: 'Delete a question' })
  remove(
    @CurrentUser('userId') userId: number,
    @Param('questionId') questionId: string,
  ) {
    return this.quizService.deleteQuestion(userId, questionId);
  }
}
