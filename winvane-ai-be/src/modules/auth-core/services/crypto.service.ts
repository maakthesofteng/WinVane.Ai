import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

export class CryptoTamperedError extends Error {
  constructor(
    message = 'Ciphertext has been tampered with or tag verification failed',
  ) {
    super(message);
    this.name = 'CryptoTamperedError';
  }
}

export class InvalidCipherFormatError extends Error {
  constructor(
    message = 'Invalid cipher payload format or unsupported version',
  ) {
    super(message);
    this.name = 'InvalidCipherFormatError';
  }
}

@Injectable()
export class CryptoService {
  private readonly keyBuffer: Buffer;

  constructor(private readonly configService: ConfigService) {
    const keyBase64 = this.configService.get<string>(
      'jwt.dataEncryptionKey',
      process.env.DATA_ENCRYPTION_KEY || '',
    );
    this.keyBuffer = Buffer.from(keyBase64, 'base64');
    if (this.keyBuffer.length !== 32) {
      throw new Error(
        'DATA_ENCRYPTION_KEY must decode to exactly 32 bytes for AES-256-GCM',
      );
    }
  }

  encrypt(plain: string): string {
    const iv = randomBytes(12);
    const cipher = createCipheriv('aes-256-gcm', this.keyBuffer, iv);

    const ciphertext = Buffer.concat([
      cipher.update(plain, 'utf8'),
      cipher.final(),
    ]);
    const tag = cipher.getAuthTag();

    return `v1.${iv.toString('base64url')}.${tag.toString('base64url')}.${ciphertext.toString('base64url')}`;
  }

  decrypt(payload: string): string {
    if (!payload || typeof payload !== 'string') {
      throw new InvalidCipherFormatError('Payload must be a non-empty string');
    }

    const parts = payload.split('.');
    if (parts.length !== 4 || parts[0] !== 'v1') {
      throw new InvalidCipherFormatError(
        'Invalid payload format. Expected v1.<iv>.<tag>.<ciphertext>',
      );
    }

    const [, ivStr, tagStr, cipherStr] = parts;

    try {
      const iv = Buffer.from(ivStr, 'base64url');
      const tag = Buffer.from(tagStr, 'base64url');
      const ciphertext = Buffer.from(cipherStr, 'base64url');

      if (iv.length !== 12 || tag.length !== 16) {
        throw new CryptoTamperedError('Invalid IV or AuthTag length');
      }

      const decipher = createDecipheriv('aes-256-gcm', this.keyBuffer, iv);
      decipher.setAuthTag(tag);

      const decrypted = Buffer.concat([
        decipher.update(ciphertext),
        decipher.final(),
      ]);

      return decrypted.toString('utf8');
    } catch (err) {
      if (err instanceof InvalidCipherFormatError) {
        throw err;
      }
      throw new CryptoTamperedError(
        err instanceof Error ? err.message : 'Decryption verification failed',
      );
    }
  }
}
