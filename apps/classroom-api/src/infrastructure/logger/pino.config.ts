import { Params } from 'nestjs-pino';

export const pinoConfig = (): Params => ({
  pinoHttp: {
    level: process.env.LOG_LEVEL || 'info',

    genReqId: (req) => req.headers['x-request-id'] ?? crypto.randomUUID(),

    redact: ['req.headers.authorization', 'res.body.password'],

    // prevent spam
    autoLogging: {
      ignore: (req) => req.url === '/api/health',
    },

    transport:
      process.env.NODE_ENV !== 'production'
        ? {
            target: 'pino-pretty',
            options: {
              colorize: true,
              translateTime: 'SYS:dd-mm-yyyy HH:MM:ss',
              ignore: 'pid,hostname',
              singleLine: false,
              messageFormat:
                '{req.method} {req.url} {res.statusCode} - {responseTime}ms',
            },
          }
        : undefined,

    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url,
        };
      },
      res(res) {
        return {
          id: res.id,
          statusCode: res.statusCode,
        };
      },
    },
  },
});
