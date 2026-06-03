import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { CompleteGoogleRegistrationDto } from './dtos/complete-google-registration.dto';
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
    return { ...this.signToken(user), message: 'Đăng nhập thành công' };
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
    return { ...this.signToken(user), message: 'Đăng ký thành công' };
  }

  async findOrCreateGoogleUser(profile: {
    email: string;
    firstName: string;
    lastName: string;
    picture: string;
  }) {
    const prisma = this.prisma as any;

    if (!profile.email) {
      throw new UnauthorizedException({
        message: 'Google không cung cấp email',
        error: 'GOOGLE_EMAIL_MISSING',
      });
    }
    const existing = await prisma.USER.findUnique({
      where: { email: profile.email },
    });

    if (existing) {
      return this.mapToAuthUser(existing);
    }

    const displayName =
      [profile.firstName, profile.lastName].filter(Boolean).join(' ').trim() ||
      profile.email.split('@')[0];

    const created = await prisma.$transaction(async (tx: any) => {
      const userCreated = await tx.uSER.create({
        data: {
          user_name: displayName,
          email: profile.email,
          password_hash: null,
          role: null,
          profile_picture: profile.picture || null,
          is_active: true,
          credit: 0,
        },
      });

      return userCreated;
    });

    return this.mapToAuthUser(created);
  }

  async completeGoogleRegistration(
    userId: number,
    dto: CompleteGoogleRegistrationDto,
  ) {
    const prisma = this.prisma as any;

    const existing = await prisma.USER.findUnique({
      where: { user_id: userId },
      include: {
        student: true,
        teacher: true,
      },
    });

    if (!existing) {
      throw new NotFoundException({
        message: 'Không tìm thấy người dùng',
        error: 'USER_NOT_FOUND',
      });
    }

    if (existing.password_hash) {
      throw new ConflictException({
        message: 'Tài khoản này không dùng Google sign up',
        error: 'GOOGLE_SIGNUP_NOT_AVAILABLE',
      });
    }

    const updated = await prisma.$transaction(async (tx: any) => {
      const userUpdated = await tx.uSER.update({
        where: { user_id: userId },
        data: {
          user_name: dto.name.trim(),
          role: dto.role,
        },
      });

      if (dto.role === 'STUDENT') {
        if (!existing.student) {
          await tx.student.create({
            data: {
              student_id: userId,
            },
          });
        }

        if (existing.teacher) {
          await tx.teacher.delete({
            where: { teacher_id: userId },
          });
        }
      }

      if (dto.role === 'TEACHER') {
        if (existing.student) {
          await tx.student.delete({
            where: { student_id: userId },
          });
        }

        if (!existing.teacher) {
          await tx.teacher.create({
            data: {
              teacher_id: userId,
            },
          });
        }
      }

      return userUpdated;
    });

    const user = this.mapToAuthUser(updated);
    return {
      ...this.signToken(user),
      message: 'Hoàn tất đăng ký Google thành công',
    };
  }

  signToken(user: AuthUser) {
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
