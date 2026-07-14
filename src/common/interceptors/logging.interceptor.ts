import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { Request } from 'express';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<Request>();
    const { method, url } = request;
    const startedAt = Date.now();

    return next.handle().pipe(
      tap({
        next: () => {
          const response = context.switchToHttp().getResponse<{ statusCode: number }>();
          this.logger.log(
            `${method} ${url} ${response.statusCode} ${Date.now() - startedAt}ms`,
          );
        },
        error: (error: Error) => {
          this.logger.warn(
            `${method} ${url} failed ${Date.now() - startedAt}ms — ${error.message}`,
          );
        },
      }),
    );
  }
}
