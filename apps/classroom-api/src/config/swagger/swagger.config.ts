import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

export function setupSwagger(app: INestApplication): void {
  const config = new DocumentBuilder()
    .setTitle('Edu-AI Classroom API')
    .setDescription(
      `
# Edu-AI Classroom API Documentation

Welcome to the Edu-AI Classroom API. This API provides comprehensive endpoints for managing educational workflows, classroom management, and AI-powered educational tools.

## Features
- 🎓 **Classroom Management**: Create and manage virtual classrooms
- 👥 **User Management**: Handle students, teachers, and administrators
- 📚 **Course & Content**: Manage courses, lessons, and educational materials
- 🤖 **AI Integration**: Leverage AI for personalized learning experiences
- 📊 **Analytics**: Track student progress and performance metrics
- 🔐 **Security**: Enterprise-grade authentication and authorization

## Getting Started
1. Authenticate using the \`/auth\` endpoints
2. Obtain your JWT token
3. Include the token in the \`Authorization\` header as \`Bearer {token}\`
4. Start making requests to the available endpoints

## Rate Limiting
- Standard tier: 100 requests per minute
- Premium tier: 1000 requests per minute

## Support
For technical support, please contact: support@edu-ai-classroom.com
      `.trim(),
    )
    .setVersion('1.0.0')
    .setTermsOfService('https://edu-ai-classroom.com/terms')
    .setContact(
      'Edu-AI Support Team',
      'https://edu-ai-classroom.com/support',
      'support@edu-ai-classroom.com',
    )
    .setLicense('MIT', 'https://opensource.org/licenses/MIT')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'Authorization',
        description: 'Enter your JWT token',
        in: 'header',
      },
      'JWT-auth',
    )
    .addApiKey(
      {
        type: 'apiKey',
        name: 'X-API-Key',
        in: 'header',
        description: 'API Key for service-to-service communication',
      },
      'API-Key',
    )
    .addServer('http://localhost:8080', 'Local Development Server')
    .addTag('Health', 'System health check endpoints')
    .addTag('Authentication', 'User authentication and authorization')
    .addTag('Users', 'User management endpoints')
    .addTag('Classrooms', 'Classroom management and operations')
    .addTag('Courses', 'Course and curriculum management')
    .addTag('Lessons', 'Lesson content and materials')
    .addTag('Assignments', 'Assignment creation and submission')
    .addTag('Grades', 'Grading and assessment')
    .addTag('Analytics', 'Performance analytics and reporting')
    .addTag('AI', 'AI-powered educational features')
    .addTag('Admin', 'Administrative operations')
    .build();

  const document = SwaggerModule.createDocument(app, config, {
    operationIdFactory: (controllerKey: string, methodKey: string) => methodKey,
    deepScanRoutes: true,
  });

  // Customize the Swagger UI
  SwaggerModule.setup('api/docs', app, document, {
    customSiteTitle: 'Edu-AI Classroom API Documentation',
    customfavIcon: 'https://edu-ai-classroom.com/favicon.ico',
    customCss: `
      .swagger-ui .topbar { display: none }
      .swagger-ui .info { margin: 50px 0 }
      .swagger-ui .info .title { font-size: 36px; font-weight: bold; color: #1a202c; }
      .swagger-ui .scheme-container { background: #f7fafc; padding: 20px; border-radius: 8px; }
      .swagger-ui .opblock-tag { font-size: 20px; font-weight: 600; }
      .swagger-ui .opblock { border-radius: 8px; margin: 15px 0; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    `,
    swaggerOptions: {
      persistAuthorization: true,
      displayRequestDuration: true,
      filter: true,
      showExtensions: true,
      showCommonExtensions: true,
      docExpansion: 'list',
      defaultModelsExpandDepth: 3,
      defaultModelExpandDepth: 3,
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
      tryItOutEnabled: true,
    },
    jsonDocumentUrl: 'api/docs-json', // JSON spec available at this URL
  });
}
