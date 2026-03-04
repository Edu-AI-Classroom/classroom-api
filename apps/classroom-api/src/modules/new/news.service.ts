import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { R2Service } from '../../infrastructure/cloudflare_r2/r2.service'; // Giữ nguyên path của bạn
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
    // Sử dụng camelCase từ DTO mới
    const { classId, content, audience, isPinned } = createNewsDto;

    // 1. Verify access
    await this.verifyTeacherAccess(userId, classId);

    // 2. Handle File Upload với R2Service
    let mediaUrl = null;
    if (file) {
      mediaUrl = await this.r2Service.uploadFile(file);
    }

    // 3. Save to DB
    const news = await this.prisma.news.create({
      data: {
        class_id: classId,
        user_post_id: userId,
        content: content,
        audience: audience || 'all',
        is_pinned: isPinned || false,
        status: 'PUBLISHED',
        media_url: mediaUrl,
        uploaded_at: new Date(),
      },
      include: {
        user_post: true, // Lấy tên tác giả
        comments: { include: { user: true } }, // Lấy sẵn mảng comments (dù lúc tạo mới là mảng rỗng)
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

    const classroom = await this.prisma.classroom.findUnique({
      where: { class_id: classId },
    });
    if (!classroom) throw new NotFoundException('Classroom not found');

    const [newsList, total] = await Promise.all([
      this.prisma.news.findMany({
        where: { class_id: classId },
        include: {
          user_post: true,
          comments: {
            include: { user: true }, // Include user để lấy role và name cho comment
            orderBy: { uploaded_at: 'asc' }, // Comment cũ xếp trên
          },
        },
        orderBy: [
          { is_pinned: 'desc' }, // Bài ghim luôn lên đầu
          { uploaded_at: 'desc' }, // Sau đó mới ưu tiên bài mới nhất
        ],
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
      include: {
        user_post: true,
        comments: {
          include: { user: true },
          orderBy: { uploaded_at: 'asc' },
        },
      },
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

    if (news.user_post_id !== userId) {
      throw new ForbiddenException('You can only edit your own posts');
    }

    let mediaUrl = news.media_url;
    if (file) {
      mediaUrl = await this.r2Service.uploadFile(file);
    }

    const updatedNews = await this.prisma.news.update({
      where: { news_id: newsId },
      data: {
        content: updateNewsDto.content,
        audience: updateNewsDto.audience,
        is_pinned: updateNewsDto.isPinned,
        media_url: mediaUrl,
        updated_at: new Date(),
      },
      include: {
        user_post: true,
        comments: { include: { user: true }, orderBy: { uploaded_at: 'asc' } },
      },
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
        `You do not have permission to post news in this class ${classId} ${userId}`,
      );
    }
  }

  // Mapper được thiết kế lại hoàn toàn để khớp 100% với Frontend Interface
  private mapToResponse(news: any): any {
    return {
      id: news.news_id.toString(), // Frontend cần ID dạng string
      author: news.user_post?.user_name || 'Unknown',
      content: news.content || '',
      createdAt: news.uploaded_at?.toISOString(),
      isPinned: news.is_pinned || false,
      audience: news.audience || 'all',
      mediaUrl: news.media_url,
      commentCount: news.comments?.length || 0,
      comments:
        news.comments?.map((c: any) => ({
          id: c.comment_id.toString(),
          author: c.user?.user_name || 'Unknown',
          authorRole: (c.user?.role?.toLowerCase() || 'student') as
            | 'teacher'
            | 'student'
            | 'parent',
          content: c.content,
          createdAt: c.uploaded_at?.toISOString(),
        })) || [],
    };
  }
}
