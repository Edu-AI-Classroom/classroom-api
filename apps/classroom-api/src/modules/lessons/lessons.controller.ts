import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  ParseUUIDPipe,
  Req,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Roles } from '../auth/decorators/public.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CreateLessonDto } from './dtos/create-lesson.dto';
import { UpdateLessonDto } from './dtos/update-lesson.dto';
import { LessonsService } from './lessons.service';
import { Express } from 'express';

@ApiTags('Lessons')
@Controller('lessons')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
export class LessonsController {
  constructor(private readonly lessonsService: LessonsService) {}

  @Post()
  @Roles('TEACHER')
  @ApiOperation({ summary: 'Create new lesson (document_type = Lesson)' })
  @ApiResponse({ status: 201, description: 'Lesson created successfully' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: CreateLessonDto })
  @UseInterceptors(FileInterceptor('file'))
  create(
    @Req() req: any, // 💡 Truyền req vào đây
    @Body() dto: CreateLessonDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.lessonsService.createLesson(req.user, dto, file); // 💡 Truyền req.user
  }

  @Get('class/:classId')
  @ApiOperation({ summary: 'List all lessons by classId' })
  findAllByClassId(
    @Req() req: any, // 💡 Cập nhật các endpoint khác tương tự
    @Param('classId') classId: string,
  ) {
    return this.lessonsService.listLessons(req.user, Number(classId));
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get lesson detail by id' })
  findOne(@Req() req: any, @Param('id', ParseUUIDPipe) id: string) {
    return this.lessonsService.getLessonById(req.user, id);
  }

  @Put(':id')
  @Roles('TEACHER')
  @ApiOperation({ summary: 'Update lesson' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: UpdateLessonDto })
  @UseInterceptors(FileInterceptor('file'))
  update(
    @Req() req: any,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateLessonDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.lessonsService.updateLesson(req.user, id, dto, file);
  }

  @Delete(':id')
  @Roles('TEACHER')
  @ApiOperation({ summary: 'Delete lesson' })
  remove(@Req() req: any, @Param('id', ParseUUIDPipe) id: string) {
    return this.lessonsService.deleteLesson(req.user, id);
  }
}
