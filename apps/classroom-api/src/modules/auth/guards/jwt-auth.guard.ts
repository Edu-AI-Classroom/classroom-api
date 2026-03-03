import {
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }
    return super.canActivate(context);
  }

  /**
   * Xử lý kết quả sau khi Passport thực hiện xác thực
   * err: Lỗi hệ thống phát sinh trong quá trình verify
   * user: Thông tin user nếu verify thành công (từ hàm validate trong JwtStrategy)
   * info: Thông tin thêm về lỗi (ví dụ: lỗi từ thư viện jsonwebtoken)
   */
  handleRequest(err: any, user: any, info: any) {
    // Nếu có lỗi hệ thống (err) hoặc không tìm thấy user
    if (err || !user) {
      // Passport trả về info.message = "No auth token" khi header trống
      if (info?.message === 'No auth token' || !info) {
        throw new UnauthorizedException({
          statusCode: 401,
          message: 'Bạn chưa cung cấp mã xác thực (Token missing)',
          error: 'MISSING_TOKEN',
        });
      }

      // Các lỗi khác như cũ
      if (info?.name === 'TokenExpiredError') {
        throw new UnauthorizedException({
          statusCode: 401,
          message: 'Phiên đăng nhập đã hết hạn (Token expired)',
          error: 'TOKEN_EXPIRED',
        });
      }

      if (info?.name === 'JsonWebTokenError') {
        throw new UnauthorizedException({
          statusCode: 401,
          message: 'Mã xác thực không hợp lệ (Invalid token)',
          error: 'INVALID_TOKEN',
        });
      }

      throw new UnauthorizedException({
        statusCode: 401,
        message:
          info?.message || 'Không thể xác thực người dùng (Unauthorized)',
        error: 'UNAUTHORIZED',
      });
    }
    return user;
  }
}
