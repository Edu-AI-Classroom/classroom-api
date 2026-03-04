import { registerAs } from '@nestjs/config';

export default registerAs('health', () => ({
  memory: {
    enableHeapCheck: process.env.HEALTH_MEMORY_HEAP === 'true',
    heapThreshold: Number(process.env.HEALTH_MEMORY_HEAP_THRESHOLD ?? 300),
    enableRssCheck: process.env.HEALTH_MEMORY_RSS === 'true',
    rssThreshold: Number(process.env.HEALTH_MEMORY_RSS_THRESHOLD ?? 300),
  },
  disk: {
    enable: process.env.HEALTH_DISK_ENABLE === 'true',
    path: process.env.HEALTH_DISK_PATH ?? '/',
    thresholdPercent: Number(process.env.HEALTH_DISK_THRESHOLD_PERCENT ?? 0.9),
  },
  database: {
    enable: process.env.HEALTH_DATABASE_ENABLE === 'true',
  },
  http: {
    enable: process.env.HEALTH_HTTP_ENABLE === 'true',
    url: process.env.HEALTH_HTTP_URL ?? 'http://localhost:3000/api/health',
  },
  microservices: {
    enable: process.env.HEALTH_MICROSERVICES_ENABLE === 'true',
    services: {
      redis: {
        transport: 'redis',
        options: {
          host: process.env.REDIS_HOST,
          port: Number(process.env.REDIS_PORT),
        },
      },
    },
  },
}));
