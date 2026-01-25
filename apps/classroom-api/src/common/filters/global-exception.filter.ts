import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ErrorResponseDto } from '../dto/api-response.dto';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let validationErrors: Array<{ field: string; message: string }> | undefined;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (typeof exceptionResponse === 'object') {
        const responseObj = exceptionResponse as any;
        message = responseObj.message || responseObj.error || message;

        // Handle validation errors
        if (Array.isArray(responseObj.message)) {
          validationErrors = responseObj.message.map((msg: any) => {
            if (typeof msg === 'string') {
              return { field: 'unknown', message: msg };
            }
            return {
              field: msg.property || msg.field || 'unknown',
              message: msg.constraints
                ? Object.values(msg.constraints).join(', ')
                : msg.message || 'Validation failed',
            };
          });
          message = 'Validation failed';
        }
      }
    } else if (exception instanceof Error) {
      message = exception.message;
      this.logger.error(
        `Error: ${exception.message}`,
        exception.stack,
        'GlobalExceptionFilter',
      );
    }

    const errorResponse: ErrorResponseDto = {
      success: false,
      statusCode: status,
      message,
      error:
        status === HttpStatus.INTERNAL_SERVER_ERROR
          ? 'Internal Server Error'
          : undefined,
      validationErrors,
      timestamp: new Date().toISOString(),
      path: request.url,
    };

    // Log the error
    this.logger.error(
      `HTTP ${status} Error - ${request.method} ${request.url}`,
      JSON.stringify(errorResponse),
    );

    response.status(status).json(errorResponse);
  }
}
