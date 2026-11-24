import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { Request, Response } from 'express';
import { REQUEST_ID_HEADER } from '../constants';

@Injectable()
export class RequestIdInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const http = context.switchToHttp();
    const req = http.getRequest<Request & { requestId?: string }>();
    const res = http.getResponse<Response>();

    const requestId =
      req.requestId || (req.headers[REQUEST_ID_HEADER] as string | undefined);

    if (requestId && !res.getHeader('X-Request-Id')) {
      res.setHeader('X-Request-Id', requestId);
    }

    return next.handle();
  }
}
