import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { EMAIL_QUEUE } from '../../common/constants';
import { IMailMessage } from './interfaces/IMailMessage';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  constructor(@InjectQueue(EMAIL_QUEUE) private readonly emailQueue: Queue) {}

  async enqueue(message: IMailMessage): Promise<void> {
    const domain = message.to.split('@')[1] || 'unknown';
    this.logger.log(`Enqueuing email job to domain "${domain}"`);

    await this.emailQueue.add('send-email', message, {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 1000,
      },
      removeOnComplete: true,
    });
  }
}
