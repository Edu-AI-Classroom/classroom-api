import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';

@Injectable()
export class CommentsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateCommentDto) {
    return this.prisma.comment.create({
      data: {
        news_id: dto.news_id,
        user_id: dto.user_id,
        content: dto.content,
        parent_comment_id: dto.parent_comment_id,
      },
    });
  }

  async findByNews(newsId: number) {
    // Lấy danh sách bình luận (bao gồm cả các phản hồi/replies)
    return this.prisma.comment.findMany({
      where: { news_id: newsId },
      include: {
        user: { select: { user_name: true, profile_picture: true } },
        replies: true, // Nếu bạn định nghĩa quan hệ tự thân trong Prisma
      },
      orderBy: { uploaded_at: 'asc' },
    });
  }

  async update(id: number, dto: UpdateCommentDto) {
    const comment = await this.prisma.comment.findUnique({
      where: { comment_id: id },
    });
    if (!comment) throw new NotFoundException('Bình luận không tồn tại');

    return this.prisma.comment.update({
      where: { comment_id: id },
      data: {
        content: dto.content,
        updated_at: new Date(),
      },
    });
  }

  async remove(id: number) {
    // Lưu ý: SQL của bạn có ON DELETE CASCADE nên xóa comment cha sẽ xóa luôn con
    return this.prisma.comment.delete({ where: { comment_id: id } });
  }
}
