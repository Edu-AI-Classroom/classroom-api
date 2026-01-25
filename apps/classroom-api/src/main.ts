import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import { TransformResponseInterceptor } from './common/interceptors/transform-response.interceptor';
import { setupSwagger } from './config/swagger/swagger.config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Global prefix
  const globalPrefix = 'api';
  app.setGlobalPrefix(globalPrefix);

  // Global exception filter
  app.useGlobalFilters(new GlobalExceptionFilter());

  // Global response interceptor
  app.useGlobalInterceptors(new TransformResponseInterceptor());

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Enable CORS
  app.enableCors({
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true,
  });

  // Setup Swagger documentation
  setupSwagger(app);

  // Start server
  const port = Number(process.env.PORT) || 8080;
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
