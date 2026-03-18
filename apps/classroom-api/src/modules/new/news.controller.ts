import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiConsumes,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import multer from 'multer';
import { ApiResponseDto } from '../../common/dto/api-response.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator'; // <--- Use your existing file
import { Roles } from '../auth/decorators/public.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CreateNewsWithMediaDto } from './dto/create-news-with-media.dto';
import { NewsResponseDto } from './dto/news-response.dto';
import { UpdateNewsWithMediaDto } from './dto/update-news-with-media.dto';
import { NewsService } from './news.service';

@ApiTags('News')
@Controller('news')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
export class NewsController {
  constructor(private readonly newsService: NewsService) {}

  @Post()
  @Roles('TEACHER', 'STUDENT', 'ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create a news post',
    description: 'Create a news/announcement with optional file attachment.',
  })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: multer.memoryStorage(),
    }),
  )
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  @ApiResponse({
    status: 201,
    description: 'News created successfully',
    type: ApiResponseDto,
  })
  async create(
    // We extract 'user_id' directly using your decorator's data parameter
    @CurrentUser('userId') userId: number,
    @Body() createNewsWithMediaDto: CreateNewsWithMediaDto,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<ApiResponseDto<NewsResponseDto>> {
    // The wrapper DTO contains the real data in the 'data' property
    const createNewsDto = createNewsWithMediaDto.data;

    const news = await this.newsService.create(userId, createNewsDto, file);

    return {
      success: true,
      statusCode: HttpStatus.CREATED,
      message: 'News created successfully',
      data: news,
      path: '/news',
      timestamp: new Date().toISOString(),
    };
  }

  @Get('class/:classId')
  @Roles('TEACHER', 'STUDENT')
  @ApiOperation({ summary: 'Get all news for a specific classroom' })
  @ApiParam({ name: 'classId', example: 1 })
  async findAll(
    @Param('classId') classId: number,
    @Query() paginationDto: PaginationDto,
  ): Promise<ApiResponseDto<{ data: NewsResponseDto[]; total: number }>> {
    const result = await this.newsService.findAll(classId, paginationDto);
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'News list retrieved successfully',
      data: result,
      path: `/news/class/${classId}`,
      timestamp: new Date().toISOString(),
    };
  }

  @Get(':id')
  @Roles('TEACHER', 'STUDENT', 'ADMIN')
  @ApiOperation({ summary: 'Get details of a specific news post' })
  async findOne(
    @Param('id') id: number,
  ): Promise<ApiResponseDto<NewsResponseDto>> {
    const news = await this.newsService.findOne(id);
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'News retrieved successfully',
      data: news,
      path: `/news/${id}`,
      timestamp: new Date().toISOString(),
    };
  }

  @Put(':id')
  @Roles('TEACHER', 'STUDENT', 'ADMIN')
  @ApiOperation({ summary: 'Update a news post' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: multer.memoryStorage(),
    }),
  )
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true })) // <-- Thêm dòng này để kích hoạt Transform
  async update(
    @CurrentUser('userId') userId: number,
    @Param('id') id: number,
    @Body() updateNewsWithMediaDto: UpdateNewsWithMediaDto,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<ApiResponseDto<NewsResponseDto>> {
    // Lấy data đã được validate và parse thông qua wrapper DTO
    const updateDto = updateNewsWithMediaDto.data;

    const news = await this.newsService.update(id, userId, updateDto, file);

    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'News updated successfully',
      data: news,
      path: `/news/${id}`,
      timestamp: new Date().toISOString(),
    };
  }

  @Delete(':id')
  @Roles('TEACHER', 'STUDENT')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a news post' })
  async remove(
    @CurrentUser('userId') userId: number, // <--- Extract userId
    @Param('id') id: number,
  ): Promise<void> {
    await this.newsService.remove(id, userId);
  }
}
