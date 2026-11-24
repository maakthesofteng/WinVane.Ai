import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MailService } from '../../mail/mail.service';
import { EmailTemplateService } from '../../mail/services/emailTemplate.service';

export interface ISendInviteEmailParams {
  to: string;
  fullName: string;
  inviterName: string;
  workspaceName: string;
  roleName: string;
  rawToken: string;
}

@Injectable()
export class InviteMemberEmailSender {
  private readonly logger = new Logger(InviteMemberEmailSender.name);
  private readonly frontendUrl: string;

  constructor(
    private readonly mailService: MailService,
    private readonly configService: ConfigService,
  ) {
    this.frontendUrl =
      this.configService.get<string>('app.frontendUrl') ||
      'http://localhost:3000';
  }

  async send(params: ISendInviteEmailParams): Promise<void> {
    const inviteUrl = `${this.frontendUrl}/accept-invite?token=${encodeURIComponent(
      params.rawToken,
    )}`;

    const year = new Date().getFullYear();
    const context = {
      workspaceName: params.workspaceName,
      fullName: params.fullName,
      inviterName: params.inviterName,
      roleName: params.roleName,
      inviteUrl,
      year,
    };

    const rendered = await EmailTemplateService.render(
      'members',
      'invite-member',
      context,
    );

    const plainText = [
      `You've been invited to join ${params.workspaceName} on WinVane.ai`,
      '',
      `Hello ${params.fullName},`,
      '',
      `${params.inviterName} has invited you to join ${params.workspaceName} as a ${params.roleName} on WinVane.ai.`,
      '',
      `Create your account by visiting:`,
      inviteUrl,
      '',
      'This invitation expires in 7 days.',
      '',
      "If you weren't expecting this, you can ignore this email.",
      '',
      `© ${year} WinVane.ai. All rights reserved.`,
    ].join('\n');

    this.logger.log(
      `Queueing member invite email for ${params.to} in workspace "${params.workspaceName}"`,
    );

    await this.mailService.enqueue({
      to: params.to,
      subject: `You've been invited to join ${params.workspaceName} on WinVane.ai`,
      html: rendered.html,
      text: plainText,
    });
  }
}
