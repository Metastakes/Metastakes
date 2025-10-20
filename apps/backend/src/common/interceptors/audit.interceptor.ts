/**
 * Audit Interceptor
 * Logs all API requests for HIPAA compliance
 */

import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request } from 'express';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  private readonly logger = new Logger(AuditInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>();
    const { method, url, ip, headers } = request;
    const userAgent = headers['user-agent'] || 'unknown';
    const user = (request as any).user; // From JWT auth

    const startTime = Date.now();

    // Log request
    const requestLog = {
      method,
      url,
      ip,
      userAgent,
      userId: user?.sub,
      userRole: user?.role,
      timestamp: new Date().toISOString(),
    };

    return next.handle().pipe(
      tap({
        next: () => {
          const duration = Date.now() - startTime;
          this.logger.log(
            `${method} ${url} - ${user?.email || 'anonymous'} - ${duration}ms`,
            'AuditLog'
          );

          // In production, send to audit log database/service
          if (process.env.NODE_ENV === 'production') {
            // TODO: Implement audit log persistence
            // this.auditService.log({ ...requestLog, duration, status: 'success' });
          }
        },
        error: (error: any) => {
          const duration = Date.now() - startTime;
          this.logger.error(
            `${method} ${url} - ${user?.email || 'anonymous'} - ${duration}ms - ERROR: ${
              error.message
            }`,
            error.stack,
            'AuditLog'
          );

          // In production, send to audit log database/service
          if (process.env.NODE_ENV === 'production') {
            // TODO: Implement audit log persistence
            // this.auditService.log({ ...requestLog, duration, status: 'error', error: error.message });
          }
        },
      })
    );
  }
}
