import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { R2Service } from '../../infrastructure/cloudflare_r2/r2.service'; // Adjust path
import { CreateNewsDto } from './dto/create-news.dto';
import { UpdateNewsDto } from './dto/update-news.dto';
import { NewsResponseDto } from './dto/news-response.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';

@Injectable()
export class NewsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly r2Service: R2Service,
  ) {}

  async create(
    userId: number,
    createNewsDto: CreateNewsDto,
    file?: Express.Multer.File,
  ): Promise<NewsResponseDto> {
    const { class_id, title, content, status } = createNewsDto;

    // 1. Verify access (User must be a Teacher or Admin in this class)
    await this.verifyTeacherAccess(userId, class_id);

    // 2. Handle File Upload
    let mediaUrl = null;
    if (file) {
      mediaUrl = await this.r2Service.uploadFile(file);
    }

    // 3. Save to DB
    const news = await this.prisma.news.create({
      data: {
        class_id,
        user_post_id: userId,
        title,
        content,
        status: status || 'PUBLISHED',
        media_url: mediaUrl,
        uploaded_at: new Date(),
      },
      include: {
        user_post: true, // To get author name
      },
    });

    return this.mapToResponse(news);
  }

  async findAll(
    classId: number,
    paginationDto: PaginationDto,
  ): Promise<{
    data: NewsResponseDto[];
    total: number;
    page: number;
    limit: number;
  }> {
    const { page = 1, limit = 10 } = paginationDto;
    const skip = (page - 1) * limit;

    // Check if class exists
    const classroom = await this.prisma.classroom.findUnique({
      where: { class_id: classId },
    });
    if (!classroom) throw new NotFoundException('Classroom not found');

    const [newsList, total] = await Promise.all([
      this.prisma.news.findMany({
        where: { class_id: classId },
        include: { user_post: true },
        orderBy: { uploaded_at: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.news.count({ where: { class_id: classId } }),
    ]);

    return {
      data: newsList.map((n) => this.mapToResponse(n)),
      total,
      page,
      limit,
    };
  }

  async findOne(newsId: number): Promise<NewsResponseDto> {
    const news = await this.prisma.news.findUnique({
      where: { news_id: newsId },
      include: { user_post: true },
    });

    if (!news) throw new NotFoundException(`News with ID ${newsId} not found`);

    return this.mapToResponse(news);
  }

  async update(
    newsId: number,
    userId: number,
    updateNewsDto: UpdateNewsDto,
    file?: Express.Multer.File,
  ): Promise<NewsResponseDto> {
    const news = await this.prisma.news.findUnique({
      where: { news_id: newsId },
    });
    if (!news) throw new NotFoundException('News not found');

    // Verify ownership or permission
    if (news.user_post_id !== userId) {
      // Optional: Allow class owner to edit any post? For now, strict ownership.
      throw new ForbiddenException('You can only edit your own posts');
    }

    let mediaUrl = news.media_url;
    if (file) {
      mediaUrl = await this.r2Service.uploadFile(file);
    }

    const updatedNews = await this.prisma.news.update({
      where: { news_id: newsId },
      data: {
        title: updateNewsDto.title,
        content: updateNewsDto.content,
        status: updateNewsDto.status,
        media_url: mediaUrl,
        updated_at: new Date(),
      },
      include: { user_post: true },
    });

    return this.mapToResponse(updatedNews);
  }

  async remove(newsId: number, userId: number): Promise<void> {
    const news = await this.prisma.news.findUnique({
      where: { news_id: newsId },
    });
    if (!news) throw new NotFoundException('News not found');

    if (news.user_post_id !== userId) {
      throw new ForbiddenException('You can only delete your own posts');
    }

    await this.prisma.news.delete({ where: { news_id: newsId } });
  }

  // --- Helpers ---

  private async verifyTeacherAccess(userId: number, classId: number) {
    // Check if user is a teacher in this class or the creator
    const classroom = await this.prisma.classroom.findFirst({
      where: {
        class_id: classId,
        is_deleted: false,
        OR: [
          { created_by: userId },
          { teacher_classroom: { some: { teacher_id: userId } } },
        ],
      },
    });

    if (!classroom) {
      throw new ForbiddenException(
        'You do not have permission to post news in this class',
      );
    }
  }

  private mapToResponse(news: any): NewsResponseDto {
    return {
      newsId: news.news_id,
      classId: news.class_id,
      title: news.title,
      content: news.content,
      mediaUrl: news.media_url,
      status: news.status,
      authorName: news.user_post?.user_name || 'Unknown',
      uploadedAt: news.uploaded_at?.toISOString(),
      updatedAt: news.updated_at?.toISOString(),
    };
  }
}
