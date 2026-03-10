import { ApiProperty } from '@nestjs/swagger';

export class CommentResponseDto {
  @ApiProperty()
  id: string; // Frontend đang dùng string cho id ('post.id')

  @ApiProperty()
  author: string;

  @ApiProperty({ enum: ['teacher', 'student', 'parent'] })
  authorRole: 'teacher' | 'student' | 'parent';

  @ApiProperty()
  content: string;

  @ApiProperty()
  createdAt: string;
}

export class NewsResponseDto {
  @ApiProperty()
  id: string; // Đổi từ newsId -> id để khớp frontend

  @ApiProperty()
  author: string; // Đổi từ authorName -> author

  @ApiProperty()
  content: string;

  @ApiProperty()
  createdAt: string; // Đổi từ uploadedAt -> createdAt

  @ApiProperty()
  isPinned: boolean;

  @ApiProperty({ enum: ['students', 'parents', 'all'] })
  audience: 'students' | 'parents' | 'all';

  @ApiProperty()
  commentCount: number;

  @ApiProperty({ type: [CommentResponseDto] })
  comments: CommentResponseDto[];
}
