import {
  ExceptionFilter,
  Catch,
  HttpException,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import type { ArgumentsHost } from '@nestjs/common';
import { Response } from 'express';
import { SentryExceptionCaptured } from '@sentry/nestjs';
import * as Sentry from '@sentry/nestjs';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  @SentryExceptionCaptured()
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | string[] = 'Erro interno do servidor';
    let errors: any = null;

    if (exception instanceof Error) {
      Sentry.logger.error('Exception caught', {
        error: exception.message,
        stack: exception.stack,
        name: exception.name,
      });
    }

    if (exception instanceof BadRequestException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'object' && 'message' in exceptionResponse) {
        const responseMessage = (exceptionResponse as any).message;

        if (Array.isArray(responseMessage)) {
          errors = responseMessage;
          message = 'Erro de validação';
          Sentry.logger.warn('Validation error', { errors: responseMessage });
        } else {
          message = responseMessage;
          Sentry.logger.warn('Bad request', { message: responseMessage });
        }
      }
    } else if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (typeof exceptionResponse === 'object' && 'message' in exceptionResponse) {
        message = (exceptionResponse as any).message;
      }

      Sentry.logger.warn('HTTP Exception', {
        status,
        message,
      });
    }

    const errorResponse = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      message,
      ...(errors && { errors }),
    };

    response.status(status).json(errorResponse);
  }
}
