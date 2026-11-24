import { Injectable } from '@nestjs/common';
import freeEmailDomains from '../data/freeEmailDomains.json';

@Injectable()
export class FreeEmailDomainService {
  private readonly blockedDomains: Set<string>;

  constructor() {
    this.blockedDomains = new Set(
      freeEmailDomains.map((d) => d.trim().toLowerCase()),
    );
  }

  extractDomain(email: string): string {
    if (!email || !email.includes('@')) {
      return '';
    }
    const parts = email.trim().split('@');
    return (parts[parts.length - 1] ?? '').trim().toLowerCase();
  }

  isFreeEmail(email: string): boolean {
    const domain = this.extractDomain(email);
    if (!domain) {
      return false;
    }
    return this.blockedDomains.has(domain);
  }
}
