import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { doubleCsrf } from 'csrf-csrf';
import { Request, Response } from 'express';
import { CSRF_HEADER_NAME } from '../../common/constants';

@Injectable()
export class CsrfService {
  private readonly generateTokenFn: (req: Request, res: Response) => string;
  private readonly validateRequestFn: (req: Request) => boolean;

  constructor(private readonly configService: ConfigService) {
    const secret =
      this.configService.get<string>('csrf.secret') ||
      'change_me_min_32_chars_long_csrf_secret_key!';
    const cookieName = this.configService.get<string>(
      'csrf.cookieName',
      'wv_csrf',
    );
    const sessionCookieName = this.configService.get<string>(
      'cookie.sessionCookieName',
      'wv_session',
    );
    const secure = Boolean(
      this.configService.get<boolean>('cookie.secure', false),
    );

    const { generateCsrfToken, validateRequest } = doubleCsrf({
      getSecret: () => secret,
      getSessionIdentifier: (req: Request) =>
        (req.cookies?.[sessionCookieName] as string) ||
        (req.ip as string) ||
        'anonymous',
      cookieName,
      cookieOptions: {
        httpOnly: true,
        sameSite: 'strict',
        secure,
        path: '/',
      },
      size: 64,
      ignoredMethods: ['GET', 'HEAD', 'OPTIONS'],
      getCsrfTokenFromRequest: (req) =>
        req.headers[CSRF_HEADER_NAME] || req.headers['x-csrf-token'],
    });

    this.generateTokenFn = generateCsrfToken;
    this.validateRequestFn = validateRequest;
  }

  generateToken(req: Request, res: Response): string {
    return this.generateTokenFn(req, res);
  }

  validate(req: Request): boolean {
    return this.validateRequestFn(req);
  }
}
