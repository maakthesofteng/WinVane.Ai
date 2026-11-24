import { z } from 'zod';
import { emailSchema, phoneSchema, uuidSchema } from '@/shared/schemas/common.schema';

export const inviteMemberSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, 'Full name must be at least 2 characters')
    .max(120, 'Full name must not exceed 120 characters'),
  email: emailSchema,
  phone: phoneSchema.nullable(),
  jobTitle: z
    .string()
    .trim()
    .max(100, 'Job title must not exceed 100 characters')
    .optional()
    .nullable(),
  roleId: uuidSchema,
});

export type TInviteMemberFormValues = z.infer<typeof inviteMemberSchema>;

export const editMemberSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, 'Full name must be at least 2 characters')
    .max(120, 'Full name must not exceed 120 characters'),
  email: z.string().optional(),
  phone: phoneSchema.nullable(),
  jobTitle: z
    .string()
    .trim()
    .max(100, 'Job title must not exceed 100 characters')
    .optional()
    .nullable(),
  roleId: uuidSchema,
});

export type TEditMemberFormValues = z.infer<typeof editMemberSchema>;

