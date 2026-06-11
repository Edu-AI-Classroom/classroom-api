import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/public.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { ChatService } from '../chat/chat.service';
import { CreateParentConversationDto, ConsumeParentLinkCodeDto } from './dtos';
import { ParentService } from './parent.service';

@ApiTags('Parent')
@Controller('parent')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('PARENT')
export class ParentController {
  constructor(
    private readonly parentService: ParentService,
    private readonly chatService: ChatService,
  ) {}

  @Post('link-codes/consume')
  async consumeLinkCode(
    @CurrentUser('userId') parentId: number,
    @Body() dto: ConsumeParentLinkCodeDto,
  ) {
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Student linked successfully',
      data: await this.parentService.consumeLinkCode(parentId, dto),
      timestamp: new Date().toISOString(),
      path: '/parent/link-codes/consume',
    };
  }

  @Get('students')
  async getStudents(@CurrentUser('userId') parentId: number) {
    return this.parentService.getLinkedStudents(parentId);
  }

  @Get('students/:studentId/classes')
  async getStudentClasses(
    @CurrentUser('userId') parentId: number,
    @Param('studentId') studentId: number,
  ) {
    return this.parentService.getStudentClasses(parentId, Number(studentId));
  }

  @Get('students/:studentId/classes/:classId/gradebook')
  async getStudentClassGradebook(
    @CurrentUser('userId') parentId: number,
    @Param('studentId') studentId: number,
    @Param('classId') classId: number,
  ) {
    return this.parentService.getStudentClassGradebook(
      parentId,
      Number(studentId),
      Number(classId),
    );
  }

  @Get('conversations')
  async getConversations(@CurrentUser('userId') parentId: number) {
    return this.chatService.getParentConversations(parentId);
  }

  @Post('conversations')
  async createConversation(
    @CurrentUser('userId') parentId: number,
    @Body() dto: CreateParentConversationDto,
  ) {
    return this.chatService.createParentConversation(
      parentId,
      Number(dto.studentId),
      Number(dto.classId),
    );
  }
}
