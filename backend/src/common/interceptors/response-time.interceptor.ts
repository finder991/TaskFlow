import {
  CallHandler,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class ResponseTimeInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (context.getType() !== 'http') {
      return next.handle();
    }

    const http = context.switchToHttp();
    const request = http.getRequest<Request>();
    const response = http.getResponse<Response>();
    const start = process.hrtime.bigint();

    const write = (status: number, withHeader: boolean): void => {
      const durationMs = Number(process.hrtime.bigint() - start) / 1_000_000;
      const rounded = durationMs.toFixed(1);
      if (withHeader && !response.headersSent) {
        response.setHeader('X-Response-Time', `${rounded}ms`);
      }
      this.logger.log(
        `${request.method} ${request.originalUrl} ${status} — ${rounded}ms`,
      );
    };

    return next.handle().pipe(
      tap({
        next: () => write(response.statusCode, true),
        error: (error: unknown) =>
          write(
            error instanceof HttpException
              ? error.getStatus()
              : HttpStatus.INTERNAL_SERVER_ERROR,
            false,
          ),
      }),
    );
  }
}
