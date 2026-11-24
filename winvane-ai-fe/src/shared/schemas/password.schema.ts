import { z } from 'zod';

export interface IPasswordRule {
  id: string;
  label: string;
  validate: (password: string, email?: string) => boolean;
}

export const PASSWORD_RULES: readonly IPasswordRule[] = [
  {
    id: 'length',
    label: 'At least 12 characters',
    validate: (password: string) => password.length >= 12 && password.length <= 128,
  },
  {
    id: 'lowercase',
    label: 'At least one lowercase letter',
    validate: (password: string) => /[a-z]/.test(password),
  },
  {
    id: 'uppercase',
    label: 'At least one uppercase letter',
    validate: (password: string) => /[A-Z]/.test(password),
  },
  {
    id: 'digit',
    label: 'At least one number',
    validate: (password: string) => /[0-9]/.test(password),
  },
  {
    id: 'symbol',
    label: 'At least one symbol (!@#$%^&*)',
    validate: (password: string) => /[^A-Za-z0-9]/.test(password),
  },
  {
    id: 'noEmailLocal',
    label: 'Does not contain your email username',
    validate: (password: string, email?: string) => {
      if (!email || !email.includes('@')) {
        return true;
      }
      const localPart = email.split('@')[0]?.trim().toLowerCase();
      if (!localPart || localPart.length < 3) {
        return true;
      }
      return !password.toLowerCase().includes(localPart);
    },
  },
] as const;

export const basePasswordSchema = z
  .string()
  .min(12, 'Password must be at least 12 characters')
  .max(128, 'Password must not exceed 128 characters')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[0-9]/, 'Password must contain at least one digit')
  .regex(/[^A-Za-z0-9]/, 'Password must contain at least one symbol');

export const passwordComplexitySchema = basePasswordSchema;

export function createPasswordSchema(email?: string) {
  return basePasswordSchema.refine(
    (password) => {
      if (!email || !email.includes('@')) {
        return true;
      }
      const localPart = email.split('@')[0]?.trim().toLowerCase();
      if (!localPart || localPart.length < 3) {
        return true;
      }
      return !password.toLowerCase().includes(localPart);
    },
    {
      message: 'Password must not contain your email username',
    }
  );
}

