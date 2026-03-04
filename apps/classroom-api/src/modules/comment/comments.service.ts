import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../infrastructure/prisma/prisma.service'; // Điều chỉnh đường dẫn theo project của bạn
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';

@Injectable()
export class CommentsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: number, dto: CreateCommentDto) {
    // Kiểm tra bài tin tức có tồn tại không
    const newsExists = await this.prisma.news.findUnique({
      where: { news_id: Number(dto.newsId) },
    });
    if (!newsExists) throw new NotFoundException('Bài viết không tồn tại');

    const newComment = await this.prisma.comment.create({
      data: {
        news_id: Number(dto.newsId), // Ép kiểu vì frontend có thể gửi dạng string
        user_id: userId, // Lấy trực tiếp từ Token người dùng thay vì frontend gửi lên
        content: dto.content,
        parent_comment_id: dto.parentCommentId,
        uploaded_at: new Date(),
      },
      include: {
        user: true, // Lấy kèm thông tin user để hiển thị tên và role
      },
    });

    return this.mapToResponse(newComment);
  }

  async findByNews(newsId: number) {
    const comments = await this.prisma.comment.findMany({
      where: { news_id: newsId },
      include: { user: true },
      orderBy: { uploaded_at: 'asc' }, // Sắp xếp bình luận cũ nhất lên trên (theo logic đọc từ trên xuống dưới)
    });

    return comments.map((c) => this.mapToResponse(c));
  }

  async update(id: number, userId: number, dto: UpdateCommentDto) {
    const comment = await this.prisma.comment.findUnique({
      where: { comment_id: id },
    });
    if (!comment) throw new NotFoundException('Không tìm thấy bình luận');

    // Chặn không cho sửa bình luận của người khác
    if (comment.user_id !== userId) {
      throw new ForbiddenException(
        'Bạn chỉ có thể chỉnh sửa bình luận của chính mình',
      );
    }

    const updatedComment = await this.prisma.comment.update({
      where: { comment_id: id },
      data: {
        content: dto.content,
        updated_at: new Date(),
      },
      include: { user: true },
    });

    return this.mapToResponse(updatedComment);
  }

  async remove(id: number, userId: number) {
    const comment = await this.prisma.comment.findUnique({
      where: { comment_id: id },
    });
    if (!comment) throw new NotFoundException('Không tìm thấy bình luận');

    // Chặn không cho xóa bình luận của người khác
    // Mở rộng sau: Có thể thêm điều kiện cho phép giáo viên (chủ lớp học) xóa comment của học sinh
    if (comment.user_id !== userId) {
      throw new ForbiddenException(
        'Bạn chỉ có thể xóa bình luận của chính mình',
      );
    }

    await this.prisma.comment.delete({
      where: { comment_id: id },
    });

    return { success: true, message: 'Đã xóa bình luận' };
  }

  // --- Helpers ---

  // Mapper chuẩn hóa dữ liệu bình luận ra cho Frontend
  private mapToResponse(comment: any) {
    return {
      id: comment.comment_id.toString(), // ID trả về dạng string cho frontend
      author: comment.user?.user_name || 'Người dùng ẩn danh',
      // Format chuỗi role từ database về định dạng literal string của frontend
      authorRole: (comment.user?.role?.toLowerCase() || 'student') as
        | 'teacher'
        | 'student'
        | 'parent',
      content: comment.content,
      createdAt: comment.uploaded_at?.toISOString() || new Date().toISOString(),
    };
  }
}
