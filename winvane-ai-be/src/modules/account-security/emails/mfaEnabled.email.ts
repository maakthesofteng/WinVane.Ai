import { EmailTemplateService } from '../../mail/services/emailTemplate.service';
import type { IMailTemplateResult } from './email.types';

export async function mfaEnabledEmail(data: {
  fullName: string;
}): Promise<IMailTemplateResult> {
  const subject =
    'Two-factor authentication enabled on your WinVane.ai account';
  const year = new Date().getFullYear();

  const { html } = await EmailTemplateService.render('auth', 'mfa-enabled', {
    fullName: data.fullName,
    year,
  });

  const text = `Hello ${data.fullName},\n\nTwo-factor authentication was successfully turned on for your WinVane.ai account.\n\nIf you did not perform this action, please contact your administrator or support immediately.`;

  return {
    subject,
    html,
    text,
  };
}
