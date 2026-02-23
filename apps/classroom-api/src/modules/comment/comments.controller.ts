import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CommentsService } from './comments.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';

@ApiTags('Comments')
@Controller('comments')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Post()
  @ApiOperation({ summary: 'Tạo bình luận mới hoặc phản hồi' })
  @ApiResponse({ status: 201, description: 'Bình luận được gửi thành công' })
  @ApiBody({ type: CreateCommentDto })
  create(@Body() dto: CreateCommentDto) {
    return this.commentsService.create(dto);
  }

  @Get('news/:newsId')
  @ApiOperation({ summary: 'Lấy tất cả bình luận của một bài tin' })
  @ApiResponse({ status: 200, description: 'Danh sách bình luận' })
  findByNews(@Param('newsId', ParseIntPipe) newsId: number) {
    return this.commentsService.findByNews(newsId);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Chỉnh sửa bình luận' })
  @ApiResponse({ status: 200, description: 'Cập nhật thành công' })
  @ApiBody({ type: UpdateCommentDto })
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateCommentDto) {
    return this.commentsService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Xóa bình luận' })
  @ApiResponse({ status: 200, description: 'Xóa thành công' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.commentsService.remove(id);
  }
}
