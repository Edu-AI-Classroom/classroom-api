import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import {
  ApiBody,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CreateLessonDto } from './dtos/create-lesson.dto';
import { UpdateLessonDto } from './dtos/update-lesson.dto';
import { LessonsService } from './lessons.service';

@ApiTags('Lessons')
@Controller('lessons')
export class LessonsController {
  constructor(private readonly lessonsService: LessonsService) {}

  @Post()
  @ApiOperation({ summary: 'Create new lesson (document_type = Lesson)' })
  @ApiResponse({ status: 201, description: 'Lesson created successfully' })
  @ApiQuery({
    name: 'ownerId',
    required: true,
    type: Number,
    description: 'ID của giáo viên (USER.user_id) sở hữu lesson',
  })
  @ApiQuery({
    name: 'subjectId',
    required: false,
    type: Number,
    description: 'ID môn học (subject.subject_id)',
  })
  @ApiQuery({
    name: 'gradeLevel',
    required: false,
    type: Number,
    description: 'Khối lớp',
  })
  @ApiBody({
    type: CreateLessonDto,
    description: 'Lesson payload',
    examples: {
      template: {
        summary: 'Template trống để tự điền',
        value: {
          title: 'Nhập tiêu đề bài giảng...',
          note: 'Ghi chú (tuỳ chọn)...',
          gradeLevel: null,
          subjectId: null,
          ownerId: 1,
          canvas: {
            settings: {
              backgroundColor: '#ffffff',
            },
            blocks: [
              {
                type: 'TEXT',
                text: 'Nhập nội dung text...',
                x: 0,
                y: 0,
                width: 300,
                height: 100,
                rotation: 0,
                zIndex: 1,
                style: {
                  color: '#000000',
                  fontSize: 24,
                  fontWeight: 'bold',
                  fontFamily: 'Arial',
                },
              },
            ],
          },
        },
      },
    },
  })
  create(
    @Query('ownerId', ParseIntPipe) ownerId: number,
    @Query('subjectId') subjectId: string | undefined,
    @Query('gradeLevel') gradeLevel: string | undefined,
    @Body() dto: CreateLessonDto,
  ) {
    return this.lessonsService.createLesson({
      ...dto,
      ownerId,
      subjectId: subjectId ? Number(subjectId) : undefined,
      gradeLevel: gradeLevel ? Number(gradeLevel) : undefined,
    });
  }

  @Get()
  @ApiOperation({ summary: 'List all lessons' })
  @ApiResponse({ status: 200, description: 'List of lessons' })
  findAll() {
    return this.lessonsService.listLessons();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get lesson detail by id' })
  @ApiResponse({ status: 200, description: 'Lesson detail' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.lessonsService.getLessonById(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update lesson and its canvas' })
  @ApiResponse({ status: 200, description: 'Lesson updated successfully' })
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateLessonDto) {
    return this.lessonsService.updateLesson(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete lesson' })
  @ApiResponse({ status: 200, description: 'Lesson deleted successfully' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.lessonsService.deleteLesson(id);
  }
}
