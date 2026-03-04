import { registerAs } from '@nestjs/config';
import { Transport } from '@nestjs/microservices';

export interface HealthConfig {
  memory: {
    enableHeapCheck: boolean;
    heapThreshold: number;
    enableRssCheck: boolean;
    rssThreshold: number;
  };

  disk: {
    enable: boolean;
    path: string;
    thresholdPercent: number;
  };

  database: {
    enable: boolean;
  };

  http: {
    enable: boolean;
    url: string;
  };

  microservices?: {
    enable: boolean;
    services: Record<
      string,
      {
        transport: Transport;
        options: Record<string, unknown>;
      }
    >;
  };
}

export default registerAs(
  'health',
  (): HealthConfig => ({
    memory: {
      enableHeapCheck: true,
      heapThreshold: 200 * 1024 * 1024, // 200MB
      enableRssCheck: true,
      rssThreshold: 3000 * 1024 * 1024, // 3GB
    },
    disk: {
      enable: true,
      path: process.cwd(),
      thresholdPercent: 0.9,
    },
    database: {
      enable: true,
    },
    http: {
      enable: true,
      url: 'https://google.com', // change to website or external API
    },
    microservices: {
      enable: false,
      services: {
        redis: {
          transport: Transport.REDIS,
          options: {
            host: 'localhost',
            port: 6379,
          },
        },
      },
    },
  }),
);
