import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import type { Request } from 'express';
import { Roles } from '../auth/decorators/public.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CreateUserDto } from './dtos/create-user.dto';
import { UpdateUserDto } from './dtos/update-user.dto';
import { UsersService } from './users.service';

@ApiTags('Users')
@Controller('users')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Tạo user mới' })
  @ApiResponse({ status: 201, description: 'User được tạo thành công' })
  @ApiResponse({ status: 409, description: 'Email đã được sử dụng' })
  @ApiBody({ type: CreateUserDto })
  create(@Body() dto: CreateUserDto) {
    return this.usersService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Danh sách tất cả user' })
  @ApiResponse({ status: 200, description: 'Danh sách user' })
  findAll() {
    return this.usersService.findAll();
  }

  @Get('current-subscription')
  @ApiOperation({ summary: 'Gói subscription hiện tại của user đăng nhập' })
  @ApiResponse({ status: 200, description: 'Thông tin gói hiện tại hoặc null' })
  getCurrentSubscription(@Req() req: Request) {
    const user: any = (req as any).user;
    const userId = user?.userId ?? user?.user_id;
    return this.usersService.getCurrentSubscription(Number(userId));
  }

  @Get('by-email')
  @ApiOperation({ summary: 'Lấy user theo email' })
  @ApiQuery({ name: 'email', required: true, description: 'Email user' })
  @ApiResponse({ status: 200, description: 'Thông tin user' })
  findByEmail(@Query('email') email: string) {
    return this.usersService.findByEmail(email);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Chi tiết user theo ID' })
  @ApiResponse({ status: 200, description: 'Thông tin user' })
  @ApiResponse({ status: 404, description: 'User không tồn tại' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Cập nhật user' })
  @ApiResponse({ status: 200, description: 'Cập nhật thành công' })
  @ApiResponse({ status: 404, description: 'User không tồn tại' })
  @ApiBody({ type: UpdateUserDto })
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateUserDto) {
    return this.usersService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Xóa user' })
  @ApiResponse({ status: 200, description: 'Xóa thành công' })
  @ApiResponse({ status: 404, description: 'User không tồn tại' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.remove(id);
  }
}
