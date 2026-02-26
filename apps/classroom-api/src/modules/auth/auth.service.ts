import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { LoginDto } from './dtos/login.dto';

export interface JwtPayload {
  sub: number;
  email: string;
}

export interface AuthUser {
  userId: number;
  userName: string;
  email: string;
  role: string | null;
  profilePicture: string | null;
  isActive: boolean | null;
  credit: number | null;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async validateUser(dto: LoginDto): Promise<AuthUser | null> {
    const prisma = this.prisma as any;

    const user = await prisma.USER.findFirst({
      where: { email: dto.email },
    });

    if (!user || !user.password_hash) {
      return null;
    }

    const isMatch = await bcrypt.compare(dto.password, user.password_hash);
    if (!isMatch) {
      return null;
    }

    if (user.is_active === false) {
      return null;
    }

    return this.mapToAuthUser(user);
  }

  async login(dto: LoginDto) {
    const user = await this.validateUser(dto);
    if (!user) {
      throw new UnauthorizedException('Email hoặc mật khẩu không đúng');
    }

    const payload: JwtPayload = { sub: user.userId, email: user.email };
    const expiresIn =
      this.configService.get<string>('auth.jwt.expiresIn') || '7d';
    const access_token = this.jwtService.sign(payload, { expiresIn } as object);

    return {
      message: 'Đăng nhập thành công',
      access_token,
      expires_in: expiresIn,
      user,
    };
  }

  async getProfile(userId: number): Promise<AuthUser | null> {
    const prisma = this.prisma as any;

    const user = await prisma.USER.findUnique({
      where: { user_id: userId },
    });

    if (!user) {
      return null;
    }

    return this.mapToAuthUser(user);
  }

  private mapToAuthUser(user: any): AuthUser {
    return {
      userId: user.user_id,
      userName: user.user_name,
      email: user.email,
      role: user.role,
      profilePicture: user.profile_picture,
      isActive: user.is_active,
      credit: user.credit,
    };
  }
}
