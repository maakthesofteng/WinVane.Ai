import { EmailTemplateService } from '../../mail/services/emailTemplate.service';

export interface IEmailTemplateResult {
  subject: string;
  html: string;
  text: string;
}

export function parseDeviceInfo(userAgent?: string): string {
  if (!userAgent || userAgent.trim() === '') {
    return 'Unknown Device';
  }

  let browser = 'Unknown Browser';
  let os = 'Unknown OS';

  if (userAgent.includes('Edg/')) {
    browser = 'Microsoft Edge';
  } else if (
    userAgent.includes('Chrome/') &&
    !userAgent.includes('Chromium/')
  ) {
    browser = 'Google Chrome';
  } else if (userAgent.includes('Firefox/')) {
    browser = 'Mozilla Firefox';
  } else if (userAgent.includes('Safari/') && !userAgent.includes('Chrome/')) {
    browser = 'Apple Safari';
  } else if (userAgent.includes('Opera') || userAgent.includes('OPR/')) {
    browser = 'Opera';
  }

  if (userAgent.includes('Windows NT 10.0')) {
    os = 'Windows 10/11';
  } else if (userAgent.includes('Windows')) {
    os = 'Windows';
  } else if (userAgent.includes('Mac OS X')) {
    os = 'macOS';
  } else if (userAgent.includes('Android')) {
    os = 'Android';
  } else if (userAgent.includes('iPhone') || userAgent.includes('iPad')) {
    os = 'iOS';
  } else if (userAgent.includes('Linux')) {
    os = 'Linux';
  }

  return `${browser} on ${os}`;
}

export async function adminLoginNotificationEmail(data: {
  fullName: string;
  ipAddress: string;
  userAgent?: string;
  timestamp?: Date;
}): Promise<IEmailTemplateResult> {
  const subject = 'New sign-in to the WinVane.ai admin portal';
  const year = new Date().getFullYear();
  const timeUtc = (data.timestamp || new Date()).toUTCString();
  const deviceInfo = parseDeviceInfo(data.userAgent);

  const { html } = await EmailTemplateService.render(
    'admin',
    'admin-login-notification',
    {
      fullName: data.fullName,
      timeUtc,
      ipAddress: data.ipAddress || 'unknown',
      deviceInfo,
      year,
    },
  );

  const text = `Security Alert: New sign-in to the WinVane.ai admin portal\n\nHello ${data.fullName},\n\nA new sign-in was detected on your WinVane.ai SuperAdmin account:\n\nTime (UTC): ${timeUtc}\nIP Address: ${data.ipAddress}\nDevice: ${deviceInfo}\n\nIf this wasn't you, run the superadmin reset procedure immediately on the server host:\nnpm run seed:superadmin -- --reset-mfa`;

  return {
    subject,
    html,
    text,
  };
}
