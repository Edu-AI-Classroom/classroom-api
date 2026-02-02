import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AuthService, AuthUser } from './auth.service';
import { CurrentUser } from './decorators/current-user.decorator';
import { Public } from './decorators/public.decorator';
import { LoginDto } from './dtos/login.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@ApiTags('Auth')
@Controller('auth')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('login')
  @ApiOperation({ summary: 'Đăng nhập (email + password), trả về JWT' })
  @ApiBody({ type: LoginDto })
  @ApiResponse({
    status: 201,
    description: 'Đăng nhập thành công, trả về access_token',
  })
  @ApiResponse({ status: 401, description: 'Email hoặc mật khẩu không đúng' })
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Get('profile')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Lấy thông tin user đang đăng nhập (cần JWT)' })
  @ApiResponse({ status: 200, description: 'Thông tin user' })
  @ApiResponse({
    status: 401,
    description: 'Chưa đăng nhập hoặc token hết hạn',
  })
  getProfile(@CurrentUser() user: AuthUser) {
    return {
      message: 'OK',
      data: user,
    };
  }
}
