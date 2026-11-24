import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Inject, Logger } from '@nestjs/common';
import type { Job } from 'bullmq';
import { EMAIL_QUEUE, MAIL_PROVIDER_TOKEN } from '../../common/constants';
import type { IMailMessage } from './interfaces/IMailMessage';
import type { IMailProvider } from './interfaces/IMailProvider';

@Processor(EMAIL_QUEUE)
export class MailProcessor extends WorkerHost {
  private readonly logger = new Logger(MailProcessor.name);

  constructor(
    @Inject(MAIL_PROVIDER_TOKEN)
    private readonly mailProvider: IMailProvider,
  ) {
    super();
  }

  async process(job: Job<IMailMessage>): Promise<void> {
    const domain = job.data.to.split('@')[1] || 'unknown';
    this.logger.log(
      `Processing email job ${job.id ?? 'unknown'} for recipient domain "${domain}"`,
    );

    await this.mailProvider.send(job.data);
  }
}
