export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 128;

export const PASSWORD_LOWERCASE_REGEX = /[a-z]/;
export const PASSWORD_UPPERCASE_REGEX = /[A-Z]/;
export const PASSWORD_DIGIT_REGEX = /[0-9]/;
export const PASSWORD_SYMBOL_REGEX = /[^A-Za-z0-9]/;

export const PASSWORD_POLICY_ERRORS = {
  TOO_SHORT: `Password must be at least ${PASSWORD_MIN_LENGTH} characters long`,
  TOO_LONG: `Password must not exceed ${PASSWORD_MAX_LENGTH} characters`,
  NO_LOWERCASE: 'Password must contain at least one lowercase letter',
  NO_UPPERCASE: 'Password must contain at least one uppercase letter',
  NO_DIGIT: 'Password must contain at least one digit',
  NO_SYMBOL: 'Password must contain at least one symbol',
  CONTAINS_EMAIL_LOCAL_PART: 'Password must not contain your email username',
} as const;

export function validatePasswordPolicy(
  password: string,
  email?: string,
): string[] {
  const errors: string[] = [];

  if (!password || password.length < PASSWORD_MIN_LENGTH) {
    errors.push(PASSWORD_POLICY_ERRORS.TOO_SHORT);
  }

  if (password && password.length > PASSWORD_MAX_LENGTH) {
    errors.push(PASSWORD_POLICY_ERRORS.TOO_LONG);
  }

  if (!PASSWORD_LOWERCASE_REGEX.test(password || '')) {
    errors.push(PASSWORD_POLICY_ERRORS.NO_LOWERCASE);
  }

  if (!PASSWORD_UPPERCASE_REGEX.test(password || '')) {
    errors.push(PASSWORD_POLICY_ERRORS.NO_UPPERCASE);
  }

  if (!PASSWORD_DIGIT_REGEX.test(password || '')) {
    errors.push(PASSWORD_POLICY_ERRORS.NO_DIGIT);
  }

  if (!PASSWORD_SYMBOL_REGEX.test(password || '')) {
    errors.push(PASSWORD_POLICY_ERRORS.NO_SYMBOL);
  }

  if (email && password) {
    const localPart = email.split('@')[0]?.trim().toLowerCase();
    if (localPart && password.toLowerCase().includes(localPart)) {
      errors.push(PASSWORD_POLICY_ERRORS.CONTAINS_EMAIL_LOCAL_PART);
    }
  }

  return errors;
}
