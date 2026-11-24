export const FREE_EMAIL_DOMAINS: readonly string[] = [
  'gmail.com',
  'googlemail.com',
  'yahoo.com',
  'ymail.com',
  'hotmail.com',
  'outlook.com',
  'live.com',
  'msn.com',
  'icloud.com',
  'me.com',
  'mac.com',
  'aol.com',
  'mail.com',
  'zoho.com',
  'protonmail.com',
  'proton.me',
  'yandex.com',
  'gmx.com',
  'gmx.net',
];

export function isFreeEmailDomain(email: string): boolean {
  if (!email || !email.includes('@')) {
    return false;
  }
  const domain = email.split('@')[1]?.trim().toLowerCase();
  if (!domain) {
    return false;
  }
  return FREE_EMAIL_DOMAINS.includes(domain);
}

