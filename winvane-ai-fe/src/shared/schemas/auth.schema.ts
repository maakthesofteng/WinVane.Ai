import { z } from 'zod';
import { emailSchema } from './common.schema';
import { basePasswordSchema } from './password.schema';

export const registerSchema = z
  .object({
    companyName: z
      .string()
      .trim()
      .min(2, 'Company name must be at least 2 characters')
      .max(120, 'Company name must not exceed 120 characters'),
    fullName: z
      .string()
      .trim()
      .min(2, 'Full name must be at least 2 characters')
      .max(120, 'Full name must not exceed 120 characters'),
    email: emailSchema,
    password: basePasswordSchema,
    confirmPassword: z.string().min(1, 'Please confirm your password'),
    acceptTerms: z.boolean().refine((val) => val === true, {
      message: 'You must accept the Terms of Service and Privacy Policy',
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })
  .refine(
    (data) => {
      const localPart = data.email?.split('@')[0]?.trim().toLowerCase();
      if (!localPart || localPart.length < 3) return true;
      return !data.password.toLowerCase().includes(localPart);
    },
    {
      message: 'Password must not contain your email username',
      path: ['password'],
    }
  );

export type TRegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
});

export type TLoginInput = z.infer<typeof loginSchema>;

export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

export type TForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z
  .object({
    password: basePasswordSchema,
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export type TResetPasswordInput = z.infer<typeof resetPasswordSchema>;

export const mfaCodeSchema = z.object({
  code: z
    .string()
    .trim()
    .length(6, 'Verification code must be 6 digits')
    .regex(/^\d{6}$/, 'Code must contain digits only'),
});

export type TMfaCodeInput = z.infer<typeof mfaCodeSchema>;

export const backupCodeSchema = z.object({
  code: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z0-9]{4}-[A-Z0-9]{4}$/, 'Format must be XXXX-XXXX'),
});

export type TBackupCodeInput = z.infer<typeof backupCodeSchema>;

