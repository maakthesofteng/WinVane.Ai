import { EmailTemplateService } from '../../mail/services/emailTemplate.service';

export interface IEmailTemplateResult {
  subject: string;
  html: string;
  text: string;
}

export async function verificationEmail(data: {
  fullName: string;
  verificationUrl: string;
  expiresHours?: number;
}): Promise<IEmailTemplateResult> {
  const expiresHours = data.expiresHours ?? 24;
  const subject = 'Verify your WinVane.ai account';
  const year = new Date().getFullYear();

  const { html } = await EmailTemplateService.render('auth', 'verification', {
    fullName: data.fullName,
    verificationUrl: data.verificationUrl,
    expiresHours,
    year,
  });

  const text = `Hello ${data.fullName},\n\nThank you for registering with WinVane.ai. Please verify your email address to activate your workspace:\n\n${data.verificationUrl}\n\nThis link expires in ${expiresHours} hours.\n\nIf you didn't request this, ignore this email.`;

  return {
    subject,
    html,
    text,
  };
}

export async function workspaceExistsEmail(data: {
  fullName: string;
  domain: string;
  loginUrl: string;
}): Promise<IEmailTemplateResult> {
  const subject = 'Workspace already exists on WinVane.ai';
  const year = new Date().getFullYear();

  const { html } = await EmailTemplateService.render(
    'auth',
    'workspace-exists',
    {
      fullName: data.fullName,
      domain: data.domain,
      loginUrl: data.loginUrl,
      year,
    },
  );

  const text = `Hello ${data.fullName},\n\nA WinVane.ai workspace already exists for ${data.domain}. Ask your workspace owner for access, or sign in if you already have an account:\n\n${data.loginUrl}\n\nIf you didn't request this, ignore this email.`;

  return {
    subject,
    html,
    text,
  };
}

export async function passwordResetEmail(data: {
  fullName: string;
  resetUrl: string;
  expiresHours?: number;
}): Promise<IEmailTemplateResult> {
  const expiresHours = data.expiresHours ?? 1;
  const subject = 'Reset your WinVane.ai password';
  const year = new Date().getFullYear();

  const { html } = await EmailTemplateService.render('auth', 'password-reset', {
    fullName: data.fullName,
    resetUrl: data.resetUrl,
    expiresHours,
    year,
  });

  const text = `Hello ${data.fullName},\n\nWe received a request to reset your password for your WinVane.ai account. Click the link below to choose a new password:\n\n${data.resetUrl}\n\nThis link expires in ${expiresHours} hour.\n\nIf you didn't request this, ignore this email.`;

  return {
    subject,
    html,
    text,
  };
}

export async function passwordChangedEmail(data: {
  fullName: string;
  loginUrl: string;
}): Promise<IEmailTemplateResult> {
  const subject = 'Your WinVane.ai password has been changed';
  const year = new Date().getFullYear();

  const { html } = await EmailTemplateService.render(
    'auth',
    'password-changed',
    {
      fullName: data.fullName,
      loginUrl: data.loginUrl,
      year,
    },
  );

  const text = `Hello ${data.fullName},\n\nYour WinVane.ai account password was recently changed. If you made this change, no further action is required.\n\nIf you did not make this change, please contact support immediately.\n\nSign in here: ${data.loginUrl}`;

  return {
    subject,
    html,
    text,
  };
}
