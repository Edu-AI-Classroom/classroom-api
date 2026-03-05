import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { LoginDto } from './dtos/login.dto';
import { RegisterDto } from './dtos/register.dto';

const SALT_ROUNDS = 10;

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
      throw new UnauthorizedException({
        message: 'Email hoặc mật khẩu không đúng',
        error: 'INVALID_CREDENTIALS',
      });
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

  async register(dto: RegisterDto) {
    const prisma = this.prisma as any;

    const existing = await prisma.USER.findUnique({
      where: { email: dto.email },
    });
    if (existing) {
      throw new ConflictException({
        message: 'Email đã được sử dụng',
        error: 'EMAIL_ALREADY_USED',
      });
    }

    const password_hash = await bcrypt.hash(dto.password, SALT_ROUNDS);
    const role = dto.role ?? 'STUDENT';

    const created = await prisma.$transaction(async (tx: any) => {
      const userCreated = await tx.uSER.create({
        data: {
          user_name: dto.name,
          email: dto.email,
          password_hash,
          role,
          profile_picture: null,
          is_active: true,
          credit: 0,
        },
      });

      if (role === 'STUDENT') {
        await tx.student.create({
          data: {
            student_id: userCreated.user_id,
          },
        });
      }

      if (role === 'TEACHER') {
        await tx.teacher.create({
          data: {
            teacher_id: userCreated.user_id,
          },
        });
      }

      return userCreated;
    });

    const user = this.mapToAuthUser(created);
    const payload: JwtPayload = { sub: user.userId, email: user.email };
    const expiresIn =
      this.configService.get<string>('auth.jwt.expiresIn') || '7d';
    const access_token = this.jwtService.sign(payload, { expiresIn } as object);

    return {
      message: 'Đăng ký thành công',
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
