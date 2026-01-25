import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  DiskHealthIndicator,
  HealthIndicatorFunction,
  HttpHealthIndicator,
  MemoryHealthIndicator,
  MicroserviceHealthIndicator,
  PrismaHealthIndicator,
} from '@nestjs/terminus';
import { HEALTH_CHECK } from '../../common/constants/health-check.constant';
import { HealthConfig } from '../../config/health/health.config';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';

@Injectable()
export class HealthService {
  constructor(
    private readonly config: ConfigService,
    private readonly http: HttpHealthIndicator,
    private readonly db: PrismaHealthIndicator,
    private readonly prisma: PrismaService,
    private readonly disk: DiskHealthIndicator,
    private readonly memory: MemoryHealthIndicator,
    private readonly microservice: MicroserviceHealthIndicator,
  ) {}

  getHealthChecks(): HealthIndicatorFunction[] {
    const healthConfig = this.config.get<HealthConfig>('health');
    const checks: HealthIndicatorFunction[] = [];

    if (!healthConfig) {
      return checks;
    }

    if (healthConfig.memory.enableHeapCheck) {
      checks.push(() =>
        this.memory.checkHeap(
          HEALTH_CHECK.MEMORY_HEAP,
          healthConfig.memory.heapThreshold,
        ),
      );
    }

    if (healthConfig.memory.enableRssCheck) {
      checks.push(() =>
        this.memory.checkRSS(
          HEALTH_CHECK.MEMORY_RSS,
          healthConfig.memory.rssThreshold,
        ),
      );
    }

    if (healthConfig.disk.enable) {
      checks.push(() =>
        this.disk.checkStorage(HEALTH_CHECK.DISK, {
          path: healthConfig.disk.path,
          thresholdPercent: healthConfig.disk.thresholdPercent,
        }),
      );
    }

    if (healthConfig.database.enable) {
      checks.push(() => this.db.pingCheck(HEALTH_CHECK.DATABASE, this.prisma));
    }

    if (healthConfig.http.enable) {
      checks.push(() =>
        this.http.pingCheck(HEALTH_CHECK.HTTP, healthConfig.http.url),
      );
    }

    if (healthConfig.microservices.enable) {
      Object.entries(healthConfig.microservices.services).forEach(
        ([key, service]) => {
          checks.push(() =>
            this.microservice.pingCheck(`${HEALTH_CHECK.MICROSERVICE}${key}`, {
              transport: service.transport,
              options: service.options,
            }),
          );
        },
      );
    }

    return checks;
  }
}
