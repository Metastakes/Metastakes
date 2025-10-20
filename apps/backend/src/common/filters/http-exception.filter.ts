/**
 * Global HTTP Exception Filter
 * Standardizes error responses and prevents PHI leakage
 */

import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let details: any = undefined;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        const res = exceptionResponse as any;
        message = res.message || res.error || message;
        details = res.details;
      }
    } else if (exception instanceof Error) {
      message = exception.message;

      // Log stack trace for internal errors
      this.logger.error(
        `Unhandled exception: ${exception.message}`,
        exception.stack,
        'HttpExceptionFilter'
      );
    }

    // HIPAA compliance: Do not expose sensitive data in error messages
    const sanitizedMessage = this.sanitizeMessage(message);

    const errorResponse = {
      success: false,
      error: {
        code: this.getErrorCode(status),
        message: sanitizedMessage,
        ...(details && process.env.NODE_ENV !== 'production' && { details }),
        ...(process.env.NODE_ENV !== 'production' && exception instanceof Error
          ? { stack: exception.stack }
          : {}),
      },
      meta: {
        timestamp: new Date().toISOString(),
        path: request.url,
        method: request.method,
      },
    };

    // Audit log for security-relevant errors
    if (status === HttpStatus.UNAUTHORIZED || status === HttpStatus.FORBIDDEN) {
      this.logger.warn(
        `Access denied: ${request.method} ${request.url} - ${sanitizedMessage}`,
        'HttpExceptionFilter'
      );
    }

    response.status(status).json(errorResponse);
  }

  /**
   * Sanitize error messages to prevent PHI leakage
   */
  private sanitizeMessage(message: string | string[]): string {
    const msg = Array.isArray(message) ? message.join(', ') : message;

    // Remove potential PHI patterns (SSN, DOB, etc.)
    const sanitized = msg
      .replace(/\b\d{3}-\d{2}-\d{4}\b/g, '[REDACTED-SSN]')
      .replace(/\b\d{2}\/\d{2}\/\d{4}\b/g, '[REDACTED-DATE]')
      .replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, '[REDACTED-EMAIL]');

    return sanitized;
  }

  /**
   * Get error code from HTTP status
   */
  private getErrorCode(status: number): string {
    const errorCodes: Record<number, string> = {
      400: 'BAD_REQUEST',
      401: 'UNAUTHORIZED',
      403: 'FORBIDDEN',
      404: 'NOT_FOUND',
      409: 'CONFLICT',
      422: 'VALIDATION_ERROR',
      429: 'RATE_LIMIT_EXCEEDED',
      500: 'INTERNAL_SERVER_ERROR',
      503: 'SERVICE_UNAVAILABLE',
    };

    return errorCodes[status] || 'UNKNOWN_ERROR';
  }
}
