import { Body, Controller, Get, Post, Req, Res } from '@nestjs/common';
import type { Request, Response } from 'express';
import { SessionService } from '../services/session.service';
import { SessionCookieService } from '../services/sessionCookie.service';
import { Public } from '../decorators/public.decorator';
import { AdminPortal } from '../decorators/adminPortal.decorator';
import { RequirePermissions } from '../decorators/requirePermissions.decorator';
import { CurrentAuth } from '../decorators/currentAuth.decorator';
import type { IAuthContext } from '../interfaces/authContext.interface';
import { TSessionPortal } from '../../auth/enums/sessionPortal.enum';
import { PERMISSIONS } from '../../rbac/constants/permissions.constants';

@Controller('__test')
export class AuthCoreTestController {
  constructor(
    private readonly sessionService: SessionService,
    private readonly sessionCookieService: SessionCookieService,
  ) {}

  @Public()
  @Post('sessions')
  async createSession(
    @Body() body: { userId: string; portal: TSessionPortal },
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ sessionId: string }> {
    const ipAddress = req.ip || '127.0.0.1';
    const userAgent = req.headers['user-agent'] || 'test-agent';

    const { session, jwt, expiresAt } = await this.sessionService.create({
      userId: body.userId,
      portal: body.portal,
      ipAddress,
      userAgent,
    });

    this.sessionCookieService.set(res, body.portal, jwt, expiresAt);

    return { sessionId: session.id };
  }

  @Get('tenant-protected')
  getTenantProtected(@CurrentAuth() auth: IAuthContext): IAuthContext {
    return auth;
  }

  @Get('tenant-permission')
  @RequirePermissions(PERMISSIONS.WORKSPACE_UPDATE)
  getTenantPermission(@CurrentAuth() auth: IAuthContext): {
    ok: boolean;
    auth: IAuthContext;
  } {
    return { ok: true, auth };
  }

  @AdminPortal()
  @Get('admin-protected')
  getAdminProtected(@CurrentAuth() auth: IAuthContext): IAuthContext {
    return auth;
  }

  @Public()
  @Get('public')
  getPublic(): { message: string } {
    return { message: 'public-access' };
  }
}
