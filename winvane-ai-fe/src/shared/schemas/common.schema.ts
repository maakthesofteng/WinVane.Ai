import { z } from 'zod';
import { isValidPhone } from '@/lib/phone/phoneUtils';

export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .email('Please enter a valid email address');

export const uuidSchema = z
  .string()
  .uuid('Invalid identifier format');

export const phoneSchema = z
  .string()
  .trim()
  .optional()
  .refine(
    (val) => !val || isValidPhone(val),
    'Please enter a valid phone number with country code'
  );
