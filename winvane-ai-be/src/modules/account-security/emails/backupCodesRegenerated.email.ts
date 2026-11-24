import { EmailTemplateService } from '../../mail/services/emailTemplate.service';
import type { IMailTemplateResult } from './email.types';

export async function backupCodesRegeneratedEmail(data: {
  fullName: string;
}): Promise<IMailTemplateResult> {
  const subject = 'Your two-factor backup recovery codes were regenerated';
  const year = new Date().getFullYear();

  const { html } = await EmailTemplateService.render(
    'auth',
    'backup-codes-regenerated',
    {
      fullName: data.fullName,
      year,
    },
  );

  const text = `Hello ${data.fullName},\n\nNew two-factor authentication backup recovery codes have been generated for your WinVane.ai account. All previous backup codes are now invalid.\n\nIf you did not regenerate these codes, please reset your password and contact support immediately.`;

  return {
    subject,
    html,
    text,
  };
}
