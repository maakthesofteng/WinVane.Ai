import {
  CountryCode,
  parsePhoneNumberFromString,
} from 'libphonenumber-js';
import { getDefaultCountry } from './countries';

export function toE164(national: string, iso2: CountryCode): string {
  if (!national || !national.trim()) return '';
  const parsed = parsePhoneNumberFromString(national, iso2);
  return parsed && parsed.isValid() ? parsed.format('E.164') : '';
}

export function parseE164(e164: string): { iso2: CountryCode; national: string } {
  if (!e164 || !e164.trim()) {
    const defaultCountry = getDefaultCountry();
    return { iso2: defaultCountry.iso2, national: '' };
  }

  const parsed = parsePhoneNumberFromString(e164);
  if (parsed && parsed.country) {
    return {
      iso2: parsed.country,
      national: parsed.nationalNumber,
    };
  }

  return { iso2: getDefaultCountry().iso2, national: e164 };
}

export function isValidPhone(e164: string): boolean {
  if (!e164 || typeof e164 !== 'string') return false;
  const parsed = parsePhoneNumberFromString(e164);
  return Boolean(parsed && parsed.isValid());
}

export function formatPhoneForDisplay(e164: string): string {
  if (!e164 || typeof e164 !== 'string') return '';
  const parsed = parsePhoneNumberFromString(e164);
  return parsed ? parsed.formatInternational() : e164;
}

