import { Inject, Injectable, Logger } from '@nestjs/common';
import { Redis } from 'ioredis';
import { REDIS_CLIENT, SESSION_CACHE_PREFIX } from '../../common/constants';

@Injectable()
export class RedisService {
  private readonly logger = new Logger(RedisService.name);

  constructor(@Inject(REDIS_CLIENT) private readonly client: Redis) {}

  async get<T = string>(key: string): Promise<T | null> {
    try {
      const data = await this.client.get(key);
      if (!data) {
        return null;
      }
      try {
        return JSON.parse(data) as T;
      } catch {
        return data as unknown as T;
      }
    } catch (error) {
      this.logger.error(`Redis get error for key "${key}":`, error);
      throw error;
    }
  }

  async set(key: string, value: unknown, ttlSeconds?: number): Promise<void> {
    try {
      const serialized =
        typeof value === 'string' ? value : JSON.stringify(value);

      if (ttlSeconds && ttlSeconds > 0) {
        await this.client.set(key, serialized, 'EX', ttlSeconds);
      } else {
        await this.client.set(key, serialized);
      }
    } catch (error) {
      this.logger.error(`Redis set error for key "${key}":`, error);
      throw error;
    }
  }

  async del(key: string): Promise<number> {
    try {
      return await this.client.del(key);
    } catch (error) {
      this.logger.error(`Redis del error for key "${key}":`, error);
      throw error;
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      const count = await this.client.exists(key);
      return count > 0;
    } catch (error) {
      this.logger.error(`Redis exists error for key "${key}":`, error);
      throw error;
    }
  }

  async incr(key: string, ttlSeconds?: number): Promise<number> {
    try {
      const count = await this.client.incr(key);
      if (count === 1 && ttlSeconds && ttlSeconds > 0) {
        await this.client.expire(key, ttlSeconds);
      }
      return count;
    } catch (error) {
      this.logger.error(`Redis incr error for key "${key}":`, error);
      throw error;
    }
  }

  async ttl(key: string): Promise<number> {
    try {
      return await this.client.ttl(key);
    } catch (error) {
      this.logger.error(`Redis ttl error for key "${key}":`, error);
      throw error;
    }
  }

  async ping(): Promise<string> {
    return this.client.ping();
  }

  // Session cache helper using SESSION_CACHE_PREFIX constant
  formatSessionKey(sessionId: string): string {
    return `${SESSION_CACHE_PREFIX}${sessionId}`;
  }
}
