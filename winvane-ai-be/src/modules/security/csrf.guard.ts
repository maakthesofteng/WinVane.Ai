import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { SKIP_CSRF_KEY } from '../../common/decorators';
import { CsrfService } from './csrf.service';

@Injectable()
export class CsrfGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly csrfService: CsrfService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const isSkipCsrf = this.reflector.getAllAndOverride<boolean>(
      SKIP_CSRF_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (isSkipCsrf) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    const method = request.method.toUpperCase();

    // Safe idempotent methods skip CSRF checks
    if (['GET', 'HEAD', 'OPTIONS'].includes(method)) {
      return true;
    }

    const isValid = this.csrfService.validate(request);
    if (!isValid) {
      throw new ForbiddenException('Invalid or missing CSRF token');
    }

    return true;
  }
}
