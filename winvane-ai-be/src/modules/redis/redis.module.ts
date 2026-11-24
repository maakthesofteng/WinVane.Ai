import {
  Global,
  Inject,
  Module,
  OnApplicationShutdown,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { REDIS_CLIENT } from '../../common/constants';
import { RedisService } from './redis.service';

@Global()
@Module({
  providers: [
    {
      provide: REDIS_CLIENT,
      inject: [ConfigService],
      useFactory: (configService: ConfigService): Redis => {
        const logger = new Logger('RedisClient');
        const host = configService.get<string>('redis.host', 'localhost');
        const port = Number(configService.get<number>('redis.port', 6379));
        const password = configService.get<string>('redis.password');

        const client = new Redis({
          host,
          port,
          password: password || undefined,
          lazyConnect: true,
          retryStrategy: (times: number) => {
            const delay = Math.min(times * 100, 3000);
            return delay;
          },
          reconnectOnError: (err: Error) => {
            const targetError = 'READONLY';
            if (err.message.includes(targetError)) {
              return true;
            }
            return false;
          },
        });

        client.on('error', (err) => {
          logger.warn(`Redis connection error: ${err.message}`);
        });

        client.on('connect', () => {
          logger.log(`Connected to Redis at ${host}:${port}`);
        });

        client.connect().catch((err: Error) => {
          logger.warn(`Initial Redis connection failed: ${err.message}`);
        });

        return client;
      },
    },
    RedisService,
  ],
  exports: [REDIS_CLIENT, RedisService],
})
export class RedisModule implements OnApplicationShutdown {
  private readonly logger = new Logger(RedisModule.name);

  constructor(@Inject(REDIS_CLIENT) private readonly client: Redis) {}

  async onApplicationShutdown(): Promise<void> {
    try {
      this.logger.log('Gracefully closing Redis client connection');
      await this.client.quit();
    } catch (error) {
      this.logger.error('Error closing Redis connection:', error);
    }
  }
}
