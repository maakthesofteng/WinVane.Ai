import {
  CountryCode,
  getCountries as getLibCountries,
  getCountryCallingCode,
} from 'libphonenumber-js';

export interface ICountry {
  iso2: CountryCode;
  name: string;
  dialCode: string; // e.g. '+92'
  flag: string;
}

function getFlagEmoji(countryCode: string): string {
  const codePoints = countryCode
    .toUpperCase()
    .split('')
    .map((char) => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
}

let cachedCountries: ICountry[] | null = null;

export function getCountries(): ICountry[] {
  if (cachedCountries) {
    return cachedCountries;
  }

  const regionNames = new Intl.DisplayNames(['en'], { type: 'region' });
  const rawCodes = getLibCountries();

  const list: ICountry[] = [];

  for (const iso2 of rawCodes) {
    try {
      const callingCode = getCountryCallingCode(iso2);
      const name = regionNames.of(iso2) || iso2;
      list.push({
        iso2,
        name,
        dialCode: `+${callingCode}`,
        flag: getFlagEmoji(iso2),
      });
    } catch {
      // Skip unsupported/deprecated country codes
    }
  }

  list.sort((a, b) => a.name.localeCompare(b.name));
  cachedCountries = list;
  return list;
}

export function getCountryByIso(iso2: string): ICountry | undefined {
  if (!iso2) return undefined;
  const upper = iso2.toUpperCase() as CountryCode;
  return getCountries().find((c) => c.iso2 === upper);
}

export function getDefaultCountry(): ICountry {
  if (typeof window !== 'undefined' && typeof navigator !== 'undefined') {
    const locale = navigator.language || (navigator.languages && navigator.languages[0]) || '';
    const parts = locale.split('-');
    if (parts.length > 1) {
      const region = parts[parts.length - 1].toUpperCase();
      const match = getCountryByIso(region);
      if (match) return match;
    }
  }

  return getCountryByIso('PK') || getCountries()[0];
}

