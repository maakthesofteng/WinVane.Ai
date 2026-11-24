import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { IMailMessage } from '../interfaces/IMailMessage';
import { IMailProvider } from '../interfaces/IMailProvider';

@Injectable()
export class EtherealMailProvider implements IMailProvider, OnModuleInit {
  private readonly logger = new Logger(EtherealMailProvider.name);
  private transporter: nodemailer.Transporter | null = null;
  private readonly from: string;

  constructor(private readonly configService: ConfigService) {
    this.from =
      this.configService.get<string>('mail.from') ||
      'WinVane.ai <no-reply@winvane.ai>';
  }

  async onModuleInit(): Promise<void> {
    const provider = this.configService.get<string>('mail.provider', 'smtp');
    if (provider === 'ethereal') {
      await this.initTransporter();
    }
  }

  private async initTransporter(): Promise<nodemailer.Transporter> {
    if (this.transporter) {
      return this.transporter;
    }

    try {
      const testAccount = await nodemailer.createTestAccount();
      this.transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });
      this.logger.log(`Initialized Ethereal test account: ${testAccount.user}`);
      return this.transporter;
    } catch (error) {
      this.logger.warn(
        `Failed to create Ethereal test account: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      throw error;
    }
  }

  async send(message: IMailMessage): Promise<void> {
    if (!this.transporter) {
      await this.initTransporter();
    }

    if (!this.transporter) {
      throw new Error('Ethereal mail transporter is not initialized');
    }

    const info = await this.transporter.sendMail({
      from: this.from,
      to: message.to,
      subject: message.subject,
      text: message.text,
      html: message.html,
    });

    const recipientDomain = message.to.split('@')[1] || 'unknown';
    const previewUrl = nodemailer.getTestMessageUrl(info);

    this.logger.log(
      `Email sent via Ethereal [messageId=${info.messageId}, domain=${recipientDomain}, previewUrl=${previewUrl || 'n/a'}]`,
    );
  }
}
