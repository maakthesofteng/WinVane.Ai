import { Injectable } from '@nestjs/common';
import { createHash, randomBytes, timingSafeEqual } from 'crypto';

@Injectable()
export class TokenService {
  generate(): string {
    return randomBytes(32).toString('base64url');
  }

  generateToken(): string {
    return this.generate();
  }

  hash(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  hashToken(token: string): string {
    return this.hash(token);
  }

  safeEqual(a: string, b: string): boolean {
    if (typeof a !== 'string' || typeof b !== 'string') {
      return false;
    }

    const bufA = Buffer.from(a, 'utf8');
    const bufB = Buffer.from(b, 'utf8');

    if (bufA.length !== bufB.length) {
      return false;
    }

    return timingSafeEqual(bufA, bufB);
  }
}
