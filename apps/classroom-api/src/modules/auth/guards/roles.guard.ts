import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/public.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();

    if (!user) {
      throw new ForbiddenException(
        'Không tìm thấy thông tin người dùng hoặc phiên đăng nhập hết hạn',
      );
    }

    // Kiểm tra xem Role của user có khớp với bất kỳ Role nào được yêu cầu không
    const hasRole = requiredRoles.some((role) => user.role === role);

    if (!hasRole) {
      // Logic edit lời nhắn thông báo lỗi tùy biến theo Role
      let roleMessage = requiredRoles.join(' hoặc ');

      // Chỉnh sửa hiển thị Tiếng Việt cho thân thiện (Tùy chọn)
      if (requiredRoles.includes('ADMIN')) roleMessage = 'Quản trị viên';
      if (requiredRoles.includes('TEACHER')) roleMessage = 'Giáo viên';
      if (requiredRoles.includes('ADMIN') && requiredRoles.includes('TEACHER'))
        roleMessage = 'Quản trị viên hoặc Giáo viên';
      if (requiredRoles.includes('STUDENT')) roleMessage = 'Học sinh';
      if (requiredRoles.includes('PARENT')) roleMessage = 'Phụ huynh';

      throw new ForbiddenException(
        `Bạn không có quyền truy cập chức năng này (Yêu cầu vai trò: ${roleMessage})`,
      );
    }

    return true;
  }
}
