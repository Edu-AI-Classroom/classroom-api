import { Module } from '@nestjs/common';
import { LoggerModule } from 'nestjs-pino';
import { pinoConfig } from './pino.config';

@Module({
  imports: [
    LoggerModule.forRootAsync({
      useFactory: pinoConfig,
    }),
  ],
})
export class AppLoggerModule {}
