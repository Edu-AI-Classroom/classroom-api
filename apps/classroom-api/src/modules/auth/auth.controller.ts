import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Request } from 'express';
import { AuthService, AuthUser } from './auth.service';
import { CurrentUser } from './decorators/current-user.decorator';
import { Public } from './decorators/public.decorator';
import { LoginDto } from './dtos/login.dto';
import { RegisterDto } from './dtos/register.dto';
import { GoogleAuthGuard } from './guards/google-auth.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@ApiTags('Auth')
@Controller('auth')
@UseGuards(JwtAuthGuard) // Chỉ dùng 1 lần ở đây
@ApiBearerAuth('JWT-auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('login')
  @ApiOperation({ summary: 'Đăng nhập' })
  @ApiResponse({ status: 201, description: 'Success' })
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Public()
  @Post('register')
  @ApiOperation({ summary: 'Đăng ký' })
  @ApiResponse({ status: 201, description: 'Success' })
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Get('profile')
  // Không cần @ApiBearerAuth ở đây nữa nếu đã có ở cấp Class
  @ApiOperation({ summary: 'Lấy thông tin profile' })
  @ApiResponse({ status: 200, description: 'Thông tin user' })
  @ApiResponse({
    status: 401,
    description: 'Giải thích cụ thể sẽ nằm ở message trả về',
  })
  getProfile(@CurrentUser() user: AuthUser) {
    return {
      message: 'OK',
      data: user,
    };
  }

  @Public()
  @Get('google')
  @UseGuards(GoogleAuthGuard)
  @ApiOperation({ summary: 'Bắt đầu đăng nhập Google OAuth' })
  @ApiResponse({ status: 302, description: 'Chuyển hướng đến Google' })
  googleAuth() {
    // Passport tự động redirect đến Google consent screen
  }

  @Public()
  @Get('google/callback')
  @UseGuards(GoogleAuthGuard)
  @ApiOperation({ summary: 'Google OAuth callback - trả về JWT' })
  @ApiResponse({
    status: 200,
    description: 'Đăng nhập Google thành công, trả về JWT',
  })
  @ApiResponse({ status: 401, description: 'Xác thực Google thất bại' })
  async googleAuthCallback(@Req() req: Request) {
    const user = req.user as AuthUser;
    return {
      ...this.authService.signToken(user),
      message: 'Đăng nhập Google thành công',
    };
  }
}
