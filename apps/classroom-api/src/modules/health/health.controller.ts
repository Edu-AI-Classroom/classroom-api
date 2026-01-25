import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { HealthCheck, HealthCheckService } from '@nestjs/terminus';
import { HealthService } from './health.service';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(
    private readonly healthService: HealthService,
    private readonly healthCheckService: HealthCheckService,
  ) {}

  @Get()
  @HealthCheck()
  @ApiOperation({
    summary: 'Health Check',
    description: `
Performs a comprehensive health check on all system components including:
- Memory usage (heap and RSS)
- Disk storage availability
- Database connectivity
- External HTTP services
- Microservices connectivity (Redis)

This endpoint is commonly used by:
- Load balancers for health monitoring
- Kubernetes liveness/readiness probes
- Monitoring systems (Prometheus, Datadog, etc.)
- CI/CD pipelines for deployment validation
    `,
  })
  @ApiResponse({
    status: 200,
    description: 'All health checks passed successfully',
    schema: {
      example: {
        status: 'ok',
        info: {
          memory_heap: {
            status: 'up',
          },
          memory_rss: {
            status: 'up',
          },
          disk: {
            status: 'up',
            thresholdPercent: 0.9,
            path: '/',
          },
          database: {
            status: 'up',
          },
          http: {
            status: 'up',
          },
          microservice_redis: {
            status: 'up',
          },
        },
        error: {},
        details: {
          memory_heap: {
            status: 'up',
          },
          memory_rss: {
            status: 'up',
          },
          disk: {
            status: 'up',
            thresholdPercent: 0.9,
            path: '/',
          },
          database: {
            status: 'up',
          },
          http: {
            status: 'up',
          },
          microservice_redis: {
            status: 'up',
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 503,
    description: 'One or more health checks failed',
    schema: {
      example: {
        status: 'error',
        info: {
          memory_heap: {
            status: 'up',
          },
        },
        error: {
          database: {
            status: 'down',
            message: 'Connection timeout',
          },
        },
        details: {
          memory_heap: {
            status: 'up',
          },
          database: {
            status: 'down',
            message: 'Connection timeout',
          },
        },
      },
    },
  })
  check() {
    return this.healthCheckService.check(this.healthService.getHealthChecks());
  }
}
