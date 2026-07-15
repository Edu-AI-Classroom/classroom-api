import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { ApiResponseDto } from '../../common/dto/api-response.dto';
import type { AuthUser } from '../auth/auth.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/public.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { AgoraService } from './agora.service';
import {
  AgoraConversationCallDto,
  AgoraSessionDto,
  AgoraTokenDto,
  CreateAgoraSessionDto,
  UpdateAgoraParticipantDto,
} from './dtos';

@ApiTags('Agora RTC')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('agora')
export class AgoraController {
  constructor(private readonly agoraService: AgoraService) {}

  @Post('classrooms/:classId/sessions')
  @Roles('TEACHER')
  @ApiOperation({ summary: 'Create a live Agora session for a classroom' })
  async createSession(
    @CurrentUser() user: AuthUser,
    @Param('classId') classId: string,
    @Body() dto: CreateAgoraSessionDto,
  ): Promise<ApiResponseDto<AgoraSessionDto>> {
    const session = await this.agoraService.createSession(
      user,
      Number(classId),
      dto,
    );
    return {
      success: true,
      statusCode: HttpStatus.CREATED,
      message: 'Agora session created successfully',
      data: session,
      path: `/agora/classrooms/${classId}/sessions`,
      timestamp: new Date().toISOString(),
    };
  }

  @Get('classrooms/:classId/sessions')
  @Roles('TEACHER', 'STUDENT')
  @ApiParam({ name: 'classId', example: 1 })
  async listSessions(
    @Param('classId') classId: string,
    @CurrentUser() user: AuthUser,
  ): Promise<ApiResponseDto<AgoraSessionDto[]>> {
    const sessions = await this.agoraService.listSessions(
      Number(classId),
      user,
    );
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Agora sessions retrieved successfully',
      data: sessions,
      path: `/agora/classrooms/${classId}/sessions`,
      timestamp: new Date().toISOString(),
    };
  }

  @Get('classrooms/:classId/sessions/:sessionId')
  @Roles('TEACHER', 'STUDENT')
  @ApiParam({ name: 'classId', example: 1 })
  @ApiParam({
    name: 'sessionId',
    example: '7b0d4d45-0f5d-4c05-83b4-e2a2d5d5d2bb',
  })
  async getSession(
    @Param('classId') classId: string,
    @Param('sessionId') sessionId: string,
    @CurrentUser() user: AuthUser,
  ): Promise<ApiResponseDto<AgoraSessionDto>> {
    const session = await this.agoraService.getSession(
      Number(classId),
      sessionId,
      user,
    );
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Agora session retrieved successfully',
      data: session,
      path: `/agora/classrooms/${classId}/sessions/${sessionId}`,
      timestamp: new Date().toISOString(),
    };
  }

  @Post('classrooms/:classId/sessions/:sessionId/token')
  @Roles('TEACHER', 'STUDENT')
  @ApiOperation({
    summary: 'Issue an Agora RTC token for the current user',
  })
  async issueToken(
    @Param('classId') classId: string,
    @Param('sessionId') sessionId: string,
    @CurrentUser() user: AuthUser,
    @Query('speaker') speaker?: string,
  ): Promise<ApiResponseDto<AgoraTokenDto>> {
    const token = await this.agoraService.issueToken(
      Number(classId),
      sessionId,
      user,
      speaker === 'true',
    );
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Agora token issued successfully',
      data: token,
      path: `/agora/classrooms/${classId}/sessions/${sessionId}/token`,
      timestamp: new Date().toISOString(),
    };
  }

  @Post('classrooms/:classId/sessions/:sessionId/join')
  @Roles('TEACHER', 'STUDENT')
  @ApiOperation({ summary: 'Record that the user has joined the live session' })
  async join(
    @Param('classId') classId: string,
    @Param('sessionId') sessionId: string,
    @CurrentUser() user: AuthUser,
  ): Promise<ApiResponseDto<AgoraSessionDto>> {
    const session = await this.agoraService.joinSession(
      Number(classId),
      sessionId,
      user,
    );
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Joined live session successfully',
      data: session,
      path: `/agora/classrooms/${classId}/sessions/${sessionId}/join`,
      timestamp: new Date().toISOString(),
    };
  }

  @Post('classrooms/:classId/sessions/:sessionId/leave')
  @Roles('TEACHER', 'STUDENT')
  @ApiOperation({ summary: 'Record that the user has left the live session' })
  async leave(
    @Param('classId') classId: string,
    @Param('sessionId') sessionId: string,
    @CurrentUser() user: AuthUser,
  ): Promise<ApiResponseDto<AgoraSessionDto>> {
    const session = await this.agoraService.leaveSession(
      Number(classId),
      sessionId,
      user,
    );
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Left live session successfully',
      data: session,
      path: `/agora/classrooms/${classId}/sessions/${sessionId}/leave`,
      timestamp: new Date().toISOString(),
    };
  }

  @Patch('classrooms/:classId/sessions/:sessionId/participants/:participantId')
  @Roles('TEACHER')
  @ApiOperation({
    summary: 'Promote or demote a participant speaker permission',
  })
  async updateParticipant(
    @Param('classId') classId: string,
    @Param('sessionId') sessionId: string,
    @Param('participantId') participantId: string,
    @CurrentUser() user: AuthUser,
    @Body() dto: UpdateAgoraParticipantDto,
  ): Promise<ApiResponseDto<AgoraSessionDto>> {
    const session = await this.agoraService.updateParticipant(
      Number(classId),
      sessionId,
      Number(participantId),
      user,
      dto,
    );
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Participant updated successfully',
      data: session,
      path: `/agora/classrooms/${classId}/sessions/${sessionId}/participants/${participantId}`,
      timestamp: new Date().toISOString(),
    };
  }

  @Post('classrooms/:classId/sessions/:sessionId/end')
  @Roles('TEACHER')
  @ApiOperation({ summary: 'End an Agora live session' })
  async endSession(
    @Param('classId') classId: string,
    @Param('sessionId') sessionId: string,
    @CurrentUser() user: AuthUser,
  ): Promise<ApiResponseDto<AgoraSessionDto>> {
    const session = await this.agoraService.endSession(
      Number(classId),
      sessionId,
      user,
    );
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Agora session ended successfully',
      data: session,
      path: `/agora/classrooms/${classId}/sessions/${sessionId}/end`,
      timestamp: new Date().toISOString(),
    };
  }

  @Post('conversations/:conversationId/calls')
  @Roles('TEACHER', 'STUDENT', 'PARENT')
  @ApiOperation({
    summary: 'Start a private video call from a chat conversation',
  })
  async startConversationCall(
    @Param('conversationId') conversationId: string,
    @CurrentUser() user: AuthUser,
  ): Promise<ApiResponseDto<AgoraConversationCallDto>> {
    const call = await this.agoraService.startConversationCall(
      Number(conversationId),
      user,
    );
    return {
      success: true,
      statusCode: HttpStatus.CREATED,
      message: 'Conversation call started successfully',
      data: call,
      path: `/agora/conversations/${conversationId}/calls`,
      timestamp: new Date().toISOString(),
    };
  }

  @Get('conversation-calls/active')
  @Roles('TEACHER', 'STUDENT', 'PARENT')
  @ApiOperation({
    summary: 'List active private conversation calls for current user',
  })
  async listActiveConversationCalls(
    @CurrentUser() user: AuthUser,
  ): Promise<ApiResponseDto<AgoraConversationCallDto[]>> {
    const calls = await this.agoraService.listActiveConversationCalls(user);
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Active conversation calls retrieved successfully',
      data: calls,
      path: '/agora/conversation-calls/active',
      timestamp: new Date().toISOString(),
    };
  }

  @Get('conversation-calls/:callId')
  @Roles('TEACHER', 'STUDENT', 'PARENT')
  async getConversationCall(
    @Param('callId') callId: string,
    @CurrentUser() user: AuthUser,
  ): Promise<ApiResponseDto<AgoraConversationCallDto>> {
    const call = await this.agoraService.getConversationCall(callId, user);
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Conversation call retrieved successfully',
      data: call,
      path: `/agora/conversation-calls/${callId}`,
      timestamp: new Date().toISOString(),
    };
  }

  @Post('conversation-calls/:callId/accept')
  @Roles('TEACHER', 'STUDENT', 'PARENT')
  async acceptConversationCall(
    @Param('callId') callId: string,
    @CurrentUser() user: AuthUser,
  ): Promise<ApiResponseDto<AgoraConversationCallDto>> {
    const call = await this.agoraService.acceptConversationCall(callId, user);
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Conversation call accepted successfully',
      data: call,
      path: `/agora/conversation-calls/${callId}/accept`,
      timestamp: new Date().toISOString(),
    };
  }

  @Post('conversation-calls/:callId/decline')
  @Roles('TEACHER', 'STUDENT', 'PARENT')
  async declineConversationCall(
    @Param('callId') callId: string,
    @CurrentUser() user: AuthUser,
  ): Promise<ApiResponseDto<AgoraConversationCallDto>> {
    const call = await this.agoraService.declineConversationCall(callId, user);
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Conversation call declined successfully',
      data: call,
      path: `/agora/conversation-calls/${callId}/decline`,
      timestamp: new Date().toISOString(),
    };
  }

  @Post('conversation-calls/:callId/end')
  @Roles('TEACHER', 'STUDENT', 'PARENT')
  async endConversationCall(
    @Param('callId') callId: string,
    @CurrentUser() user: AuthUser,
  ): Promise<ApiResponseDto<AgoraConversationCallDto>> {
    const call = await this.agoraService.endConversationCall(callId, user);
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Conversation call ended successfully',
      data: call,
      path: `/agora/conversation-calls/${callId}/end`,
      timestamp: new Date().toISOString(),
    };
  }

  @Post('conversation-calls/:callId/token')
  @Roles('TEACHER', 'STUDENT', 'PARENT')
  async issueConversationCallToken(
    @Param('callId') callId: string,
    @CurrentUser() user: AuthUser,
  ): Promise<ApiResponseDto<AgoraTokenDto>> {
    const token = await this.agoraService.issueConversationCallToken(
      callId,
      user,
    );
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Conversation call token issued successfully',
      data: token,
      path: `/agora/conversation-calls/${callId}/token`,
      timestamp: new Date().toISOString(),
    };
  }
}
