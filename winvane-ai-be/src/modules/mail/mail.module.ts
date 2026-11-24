import { Global, Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { EMAIL_QUEUE, MAIL_PROVIDER_TOKEN } from '../../common/constants';
import { MailProcessor } from './mail.processor';
import { MailService } from './mail.service';
import { EmailTemplateService } from './services/emailTemplate.service';
import { EtherealMailProvider } from './providers/etherealMail.provider';
import { SmtpMailProvider } from './providers/smtpMail.provider';

@Global()
@Module({
  imports: [
    ConfigModule,
    BullModule.registerQueue({
      name: EMAIL_QUEUE,
    }),
  ],
  providers: [
    SmtpMailProvider,
    EtherealMailProvider,
    {
      provide: MAIL_PROVIDER_TOKEN,
      inject: [ConfigService, SmtpMailProvider, EtherealMailProvider],
      useFactory: (
        configService: ConfigService,
        smtpProvider: SmtpMailProvider,
        etherealProvider: EtherealMailProvider,
      ) => {
        const provider = configService.get<string>('mail.provider', 'smtp');
        if (provider === 'ethereal') {
          return etherealProvider;
        }
        return smtpProvider;
      },
    },
    MailService,
    MailProcessor,
    EmailTemplateService,
  ],
  exports: [MailService, MAIL_PROVIDER_TOKEN, EmailTemplateService],
})
export class MailModule {}
