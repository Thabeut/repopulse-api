import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, map } from 'rxjs';
import { ApiSuccessResponse, PaginationMeta } from '../dto/api-response';

export interface ResponseWithMeta<T> {
  data: T;
  meta?: PaginationMeta;
}

@Injectable()
export class TransformInterceptor<T>
  implements NestInterceptor<T, ApiSuccessResponse<T>>
{
  intercept(
    _context: ExecutionContext,
    next: CallHandler,
  ): Observable<ApiSuccessResponse<T>> {
    return next.handle().pipe(
      map((payload) => {
        if (
          payload &&
          typeof payload === 'object' &&
          'data' in (payload as object) &&
          Object.prototype.hasOwnProperty.call(payload, 'data')
        ) {
          const wrapped = payload as ResponseWithMeta<T>;
          return {
            success: true as const,
            data: wrapped.data,
            ...(wrapped.meta ? { meta: wrapped.meta } : {}),
          };
        }

        return {
          success: true as const,
          data: payload as T,
        };
      }),
    );
  }
}
