import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { IMailMessage } from '../interfaces/IMailMessage';
import { IMailProvider } from '../interfaces/IMailProvider';

@Injectable()
export class SmtpMailProvider implements IMailProvider, OnModuleInit {
  private readonly logger = new Logger(SmtpMailProvider.name);
  private transporter: nodemailer.Transporter;
  private readonly from: string;

  constructor(private readonly configService: ConfigService) {
    this.from =
      this.configService.get<string>('mail.from') ||
      'WinVane.ai <no-reply@winvane.ai>';

    const configuredHost = this.configService.get<string>(
      'mail.smtpHost',
      '127.0.0.1',
    );
    const host = configuredHost === 'localhost' ? '127.0.0.1' : configuredHost;
    const port = Number(this.configService.get<number>('mail.smtpPort', 1025));
    const secure = Boolean(
      this.configService.get<boolean>('mail.smtpSecure', false),
    );
    const user = this.configService.get<string>('mail.smtpUser');
    const pass = this.configService.get<string>('mail.smtpPassword');

    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: user ? { user, pass: pass || '' } : undefined,
    });
  }

  async onModuleInit(): Promise<void> {
    try {
      await this.transporter.verify();
      this.logger.log('SMTP connection verified successfully');
    } catch (error) {
      this.logger.warn(
        `SMTP server unreachable on startup (safe to ignore if running locally without Mailpit): ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  async send(message: IMailMessage): Promise<void> {
    const info = await this.transporter.sendMail({
      from: this.from,
      to: message.to,
      subject: message.subject,
      text: message.text,
      html: message.html,
    });

    const recipientDomain = message.to.split('@')[1] || 'unknown';
    this.logger.log(
      `Email sent via SMTP [messageId=${info.messageId}, domain=${recipientDomain}]`,
    );
  }
}
