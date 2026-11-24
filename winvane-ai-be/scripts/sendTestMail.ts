import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from '../src/app.module';
import { MailService } from '../src/modules/mail/mail.service';

async function sendTestEmail(): Promise<void> {
  const logger = new Logger('MailTestScript');
  logger.log('Booting application context to send test email...');

  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['log', 'error', 'warn', 'debug'],
  });

  try {
    const configService = app.get(ConfigService);
    const mailService = app.get(MailService);

    const testTo = configService.get<string>(
      'mail.testTo',
      'dev@example.com',
    );
    const provider = configService.get<string>('mail.provider', 'smtp');

    logger.log(
      `Enqueuing test email to ${testTo} using provider "${provider}"...`,
    );

    await mailService.enqueue({
      to: testTo,
      subject: 'WinVane.ai Infrastructure Verification',
      text: 'This is a test email verifying BullMQ queue and Nodemailer provider delivery.',
      html: '<h2>WinVane.ai Email Infrastructure</h2><p>This email verifies queue, processor, and Nodemailer integration.</p>',
    });

    logger.log('Email successfully enqueued! Waiting for queue processor...');
    // Allow BullMQ worker sufficient time to process the queued job
    await new Promise((resolve) => setTimeout(resolve, 3000));
    logger.log('Test email job dispatched successfully.');
  } catch (error) {
    logger.error('Failed to send test email:', error);
    process.exitCode = 1;
  } finally {
    await app.close();
  }
}

void sendTestEmail();
