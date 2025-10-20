/**
 * Transform Interceptor
 * Standardizes all API responses
 */

import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface APIResponse<T> {
  success: boolean;
  data: T;
  meta: {
    timestamp: Date;
  };
}

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, APIResponse<T>> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<APIResponse<T>> {
    return next.handle().pipe(
      map((data) => ({
        success: true,
        data,
        meta: {
          timestamp: new Date(),
        },
      }))
    );
  }
}
