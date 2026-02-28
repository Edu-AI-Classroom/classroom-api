import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express'; // <--- Changed to Express
import { json, urlencoded } from 'express'; // <--- Import Express middleware
import { AppModule } from './app/app.module';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import { TransformResponseInterceptor } from './common/interceptors/transform-response.interceptor';
import { setupSwagger } from './config/swagger/swagger.config';

async function bootstrap() {
  // 1. Create App with Express Adapter (Standard)
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // 2. Set Global Prefix
  const globalPrefix = 'api';
  app.setGlobalPrefix(globalPrefix);

  // 3. Configure Body Limits (Replaces Fastify multipart limits)
  // This allows JSON and URL-encoded bodies up to 20MB
  app.use(json({ limit: '20mb' }));
  app.use(urlencoded({ extended: true, limit: '20mb' }));

  // 4. Global Filters & Interceptors
  app.useGlobalFilters(new GlobalExceptionFilter());
  app.useGlobalInterceptors(new TransformResponseInterceptor());

  // 5. Global Validation Pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true, // <--- Crucial for DTO number conversion
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // 6. Enable CORS
  app.enableCors({
    origin: process.env.CORS_ORIGIN || true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  });

  // 7. Setup Swagger
  // Note: If setupSwagger uses 'NestFastifyApplication' type internally,
  // you might need to change it to 'INestApplication' or 'NestExpressApplication' inside that file.
  setupSwagger(app);

  // 8. Start Server
  const port = Number(process.env.PORT) || 8080;

  // Express usually listens on 0.0.0.0 by default when a port is provided,
  // but we can specify it explicitly to be safe.
  await app.listen(port, '0.0.0.0');

  app.enableShutdownHooks();

  Logger.log(
    `🚀 Application is running on: http://localhost:${port}/${globalPrefix}`,
  );
  Logger.log(
    `📚 Swagger documentation available at: http://localhost:${port}/${globalPrefix}/docs`,
  );
}

bootstrap();
