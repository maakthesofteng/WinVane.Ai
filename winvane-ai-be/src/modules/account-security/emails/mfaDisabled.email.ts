import { EmailTemplateService } from '../../mail/services/emailTemplate.service';
import type { IMailTemplateResult } from './email.types';

export async function mfaDisabledEmail(data: {
  fullName: string;
  resetPasswordUrl: string;
}): Promise<IMailTemplateResult> {
  const subject =
    'Two-factor authentication disabled on your WinVane.ai account';
  const year = new Date().getFullYear();

  const { html } = await EmailTemplateService.render('auth', 'mfa-disabled', {
    fullName: data.fullName,
    resetPasswordUrl: data.resetPasswordUrl,
    year,
  });

  const text = `Hello ${data.fullName},\n\nTwo-factor authentication was turned off for your WinVane.ai account.\n\nIf this wasn't you, reset your password now: ${data.resetPasswordUrl}`;

  return {
    subject,
    html,
    text,
  };
}
