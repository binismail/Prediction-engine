import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { QueryFailedError } from 'typeorm';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let error = 'Internal Server Error';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const responseBody = exception.getResponse();
      message = typeof responseBody === 'string' ? responseBody : (responseBody as any).message || message;
      error = (responseBody as any).error || error;
    } else if (exception instanceof QueryFailedError) {
      // Handle Database Errors (TypeORM)
      status = HttpStatus.BAD_REQUEST;
      message = exception.message;
      error = 'Database Error';
      
      // Customize specific DB errors
      if ((exception as any).code === '23505') { // Unique constraint
        status = HttpStatus.CONFLICT;
        message = 'Resource already exists';
      }
    } else if (exception instanceof Error) {
        message = exception.message;
    }

    this.logger.error(`Error: ${message}`, (exception as any).stack);

    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      error: error,
      message: message,
    });
  }
}
