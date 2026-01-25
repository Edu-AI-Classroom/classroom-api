import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  constructor(configService: ConfigService) {
    const connectionString = configService.get<string>('DATABASE_URL');
    const pool = new Pool({ connectionString });
    const adapter = new PrismaPg(pool);

    super({
      adapter,
      log:
        configService.get('NODE_ENV') === 'development'
          ? ['query', 'error', 'warn', 'info']
          : ['error', 'warn'],
    });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async enableShutdownHooks() {
    await this.$disconnect();
  }
}
