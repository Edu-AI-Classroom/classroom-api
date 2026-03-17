import { Body, Controller, Param, Post, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/public.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { GenerateQuizWithAiDto } from './dtos/generate-quiz-with-ai.dto';
import { AiQuizService } from './ai-quiz.service';

@ApiTags('AI Quiz')
@Controller('teacher/quizzes')
@ApiBearerAuth('JWT-auth')
@UseGuards(RolesGuard)
export class AiQuizController {
  constructor(private readonly aiQuiz: AiQuizService) {}

  @Post(':quizId/ai-generate')
  @Roles('TEACHER')
  @ApiOperation({ summary: 'Generate quiz questions with Gemini AI' })
  @ApiResponse({ status: 200, description: 'AI-generated questions' })
  generate(
    @CurrentUser('userId') userId: number,
    @Param('quizId') quizId: string,
    @Body() dto: GenerateQuizWithAiDto,
  ) {
    return this.aiQuiz.generateForQuiz(userId, quizId, dto);
  }
}

