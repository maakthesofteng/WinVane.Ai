import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';
import { REQUEST_ID_HEADER } from '../constants';

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

@Injectable()
export class RequestIdMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction): void {
    const incomingId = req.headers[REQUEST_ID_HEADER];
    const requestId =
      typeof incomingId === 'string' && UUID_REGEX.test(incomingId)
        ? incomingId
        : randomUUID();

    req.headers[REQUEST_ID_HEADER] = requestId;
    (req as Request & { id: string; requestId: string }).id = requestId;
    (req as Request & { id: string; requestId: string }).requestId = requestId;

    res.setHeader('X-Request-Id', requestId);
    next();
  }
}
