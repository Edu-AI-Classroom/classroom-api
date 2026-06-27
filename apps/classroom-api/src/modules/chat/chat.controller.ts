import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { R2Service } from '../../infrastructure/cloudflare_r2/r2.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/public.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { ChatService } from './chat.service';
import {
  CreateMessageDto,
  CreateStudentConversationDto,
  CreateTeacherConversationDto,
} from './dtos';

@ApiTags('Chat')
@Controller('chat')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ChatController {
  constructor(
    private readonly chatService: ChatService,
    private readonly r2Service: R2Service,
  ) {}

  @Get('teacher/conversations')
  @Roles('TEACHER')
  async getTeacherConversations(
    @CurrentUser('userId') teacherId: number,
    @Query('classId') classId?: string,
  ) {
    return this.chatService.getTeacherConversations(
      teacherId,
      classId ? Number(classId) : undefined,
    );
  }

  @Get('student/conversations')
  @Roles('STUDENT')
  async getStudentConversations(
    @CurrentUser('userId') studentId: number,
    @Query('classId') classId?: string,
  ) {
    return this.chatService.getStudentConversations(
      studentId,
      classId ? Number(classId) : undefined,
    );
  }

  @Post('student/conversations')
  @Roles('STUDENT')
  async createStudentConversation(
    @CurrentUser('userId') studentId: number,
    @Body() dto: CreateStudentConversationDto,
  ) {
    return this.chatService.createStudentConversation(studentId, dto.classId);
  }

  @Post('teacher/student-conversations')
  @Roles('TEACHER')
  async createTeacherStudentConversation(
    @CurrentUser('userId') teacherId: number,
    @Body() dto: CreateTeacherConversationDto,
  ) {
    return this.chatService.createTeacherStudentConversation(
      teacherId,
      dto.classId,
      dto.studentId,
    );
  }

  @Post('teacher/parent-conversations')
  @Roles('TEACHER')
  async createTeacherParentConversation(
    @CurrentUser('userId') teacherId: number,
    @Body() dto: CreateTeacherConversationDto,
  ) {
    return this.chatService.createTeacherParentConversation(
      teacherId,
      dto.classId,
      dto.studentId,
    );
  }

  @Get('conversations/:id/messages')
  @Roles('PARENT', 'TEACHER', 'STUDENT')
  async getMessages(
    @CurrentUser('userId') userId: number,
    @Param('id') conversationId: number,
    @Query('cursor') cursor?: string,
    @Query('limit') limit?: string,
  ) {
    return this.chatService.getMessages(
      userId,
      Number(conversationId),
      cursor ? Number(cursor) : undefined,
      limit ? Number(limit) : undefined,
    );
  }

  @Post('conversations/:id/messages')
  @Roles('PARENT', 'TEACHER', 'STUDENT')
  async createMessage(
    @CurrentUser('userId') userId: number,
    @Param('id') conversationId: number,
    @Body() dto: CreateMessageDto,
  ) {
    return this.chatService.createMessage(userId, Number(conversationId), dto);
  }

  @Post('conversations/:id/messages/with-files')
  @Roles('PARENT', 'TEACHER', 'STUDENT')
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        body: {
          type: 'string',
          example: 'Here is an attachment for this conversation.',
        },
        files: {
          type: 'array',
          items: {
            type: 'string',
            format: 'binary',
          },
        },
      },
    },
  })
  @UseInterceptors(
    FilesInterceptor('files', 5, { limits: { fileSize: 10 * 1024 * 1024 } }),
  )
  async createMessageWithFiles(
    @CurrentUser('userId') userId: number,
    @Param('id') conversationId: number,
    @Body('body') body: string | undefined,
    @UploadedFiles() files: Express.Multer.File[] = [],
  ) {
    const attachments = await Promise.all(
      files.map(async (file) => ({
        fileUrl: await this.r2Service.uploadFile(file),
        fileName: file.originalname,
        mimeType: file.mimetype,
        fileSize: file.size,
      })),
    );
    return this.chatService.createMessage(userId, Number(conversationId), {
      body,
      attachments,
    });
  }

  @Patch('conversations/:id/read')
  @Roles('PARENT', 'TEACHER', 'STUDENT')
  async markRead(
    @CurrentUser('userId') userId: number,
    @Param('id') conversationId: number,
  ) {
    return {
      success: true,
      statusCode: HttpStatus.OK,
      data: await this.chatService.markRead(userId, Number(conversationId)),
      message: 'Conversation marked as read',
      timestamp: new Date().toISOString(),
      path: `/chat/conversations/${conversationId}/read`,
    };
  }
}
