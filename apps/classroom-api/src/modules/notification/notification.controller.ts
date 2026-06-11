import {
  Controller,
  Get,
  Param,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { NotificationService } from './notification.service';

@ApiTags('Notifications')
@Controller('notifications')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get()
  list(@CurrentUser('userId') userId: number, @Query('limit') limit?: string) {
    return this.notificationService.list(userId, limit ? Number(limit) : 20);
  }

  @Get('unread-count')
  unreadCount(@CurrentUser('userId') userId: number) {
    return this.notificationService.unreadCount(userId);
  }

  @Patch(':id/read')
  markRead(
    @CurrentUser('userId') userId: number,
    @Param('id') notificationId: number,
  ) {
    return this.notificationService.markRead(userId, Number(notificationId));
  }

  @Patch('read-all')
  markAllRead(@CurrentUser('userId') userId: number) {
    return this.notificationService.markAllRead(userId);
  }
}
