import type { ICompanyBrain, ICompanyBrainFields } from '../types/companyBrain.types';

export const LIST_KEYS = ['techStacks', 'industries', 'services', 'targetRegions'] as const;

export const TEXT_KEYS = [
  'companySizeBand',
  'pricingRange',
  'pricingModel',
  'summary',
  'websiteUrl',
] as const;

export function getFields(profile: ICompanyBrain): ICompanyBrainFields {
  return {
    techStacks: profile.techStacks,
    industries: profile.industries,
    services: profile.services,
    targetRegions: profile.targetRegions,
    companySizeBand: profile.companySizeBand,
    pricingRange: profile.pricingRange,
    pricingModel: profile.pricingModel,
    summary: profile.summary,
    websiteUrl: profile.websiteUrl,
  };
}

export function getListInputs(profile: ICompanyBrain) {
  return {
    techStacks: profile.techStacks.join(', '),
    industries: profile.industries.join(', '),
    services: profile.services.join(', '),
    targetRegions: profile.targetRegions.join(', '),
  };
}

export function splitList(value: string): string[] {
  return [
    ...new Set(
      value
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean)
    ),
  ];
}

export function withoutClientId<T extends { id: string }>(item: T): Omit<T, 'id'> {
  const payload = { ...item };
  Reflect.deleteProperty(payload, 'id');
  return payload;
}
