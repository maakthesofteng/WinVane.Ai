import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CookieOptions, Response } from 'express';
import { TSessionPortal } from '../../auth/enums/sessionPortal.enum';

@Injectable()
export class SessionCookieService {
  private readonly tenantCookieName: string;
  private readonly adminCookieName: string;
  private readonly mfaCookieName: string;
  private readonly mfaTtlSeconds: number;
  private readonly isSecure: boolean;
  private readonly domain: string;

  constructor(private readonly configService: ConfigService) {
    this.tenantCookieName = this.configService.get<string>(
      'cookie.sessionCookieName',
      'wv_session',
    );
    this.adminCookieName = this.configService.get<string>(
      'cookie.adminSessionCookieName',
      'wv_admin_session',
    );
    this.mfaCookieName = this.configService.get<string>(
      'cookie.mfaChallengeCookieName',
      'wv_mfa_challenge',
    );
    this.mfaTtlSeconds = this.configService.get<number>(
      'cookie.mfaChallengeTtlSeconds',
      300,
    );
    this.isSecure = this.configService.get<boolean>('cookie.secure', false);
    this.domain = this.configService.get<string>('cookie.domain', 'localhost');
  }

  private getBaseOptions(): CookieOptions {
    const options: CookieOptions = {
      httpOnly: true,
      secure: this.isSecure,
      sameSite: 'strict',
      path: '/',
    };

    if (this.domain && this.domain !== 'localhost') {
      options.domain = this.domain;
    }

    return options;
  }

  getCookieName(portal: TSessionPortal): string {
    return portal === 'admin' ? this.adminCookieName : this.tenantCookieName;
  }

  set(
    res: Response,
    portal: TSessionPortal,
    jwt: string,
    expiresAt: Date,
  ): void {
    const cookieName = this.getCookieName(portal);
    res.cookie(cookieName, jwt, {
      ...this.getBaseOptions(),
      expires: expiresAt,
    });
  }

  clear(res: Response, portal: TSessionPortal): void {
    const cookieName = this.getCookieName(portal);
    res.clearCookie(cookieName, this.getBaseOptions());
  }

  setMfaChallenge(res: Response, challengeId: string): void {
    const options: CookieOptions = {
      ...this.getBaseOptions(),
      sameSite: 'lax',
      path: '/',
      maxAge: this.mfaTtlSeconds * 1000,
    };
    res.cookie(this.mfaCookieName, challengeId, options);
  }

  clearMfaChallenge(res: Response): void {
    const options: CookieOptions = {
      ...this.getBaseOptions(),
      sameSite: 'lax',
      path: '/',
    };
    res.clearCookie(this.mfaCookieName, options);
  }
}
