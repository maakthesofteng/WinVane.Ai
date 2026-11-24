'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { ICompanyBrainFields } from '../types/companyBrain.types';

export type TCompanyBrainListInputs = Record<
  'techStacks' | 'industries' | 'services' | 'targetRegions',
  string
>;
type TCompanyBrainListKey = keyof TCompanyBrainListInputs;
type TCompanyBrainTextKey = 'companySizeBand' | 'pricingRange' | 'pricingModel';
type TCompanyBrainOverviewKey = 'summary' | 'websiteUrl';

interface ICompanyBrainProfileFieldsProps {
  fields: ICompanyBrainFields;
  listInputs: TCompanyBrainListInputs;
  canEdit: boolean;
  isSaving: boolean;
  onListChange: (key: TCompanyBrainListKey, value: string) => void;
  onTextChange: (key: TCompanyBrainTextKey | TCompanyBrainOverviewKey, value: string) => void;
}

const LIST_FIELDS: Array<{
  key: TCompanyBrainListKey;
  label: string;
  placeholder: string;
}> = [
  { key: 'techStacks', label: 'Tech stack delivered', placeholder: 'React, Node.js, PostgreSQL' },
  { key: 'industries', label: 'Industries served', placeholder: 'Healthcare, financial services' },
  {
    key: 'services',
    label: 'Services offered',
    placeholder: 'Product development, cloud migration',
  },
  { key: 'targetRegions', label: 'Target regions', placeholder: 'North America, Europe' },
];

const TEXT_FIELDS: Array<{
  key: TCompanyBrainTextKey;
  label: string;
  placeholder: string;
}> = [
  { key: 'companySizeBand', label: 'Company size band', placeholder: '11-50 employees' },
  { key: 'pricingRange', label: 'Pricing range', placeholder: '$50,000-$100,000' },
  { key: 'pricingModel', label: 'Pricing model', placeholder: 'Fixed price, time and materials' },
];

export function CompanyBrainProfileFields({
  fields,
  listInputs,
  canEdit,
  isSaving,
  onListChange,
  onTextChange,
}: ICompanyBrainProfileFieldsProps) {
  const isDisabled = !canEdit || isSaving;

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Capabilities and market experience</CardTitle>
          <CardDescription>
            Separate list entries with commas. You can edit any extracted value.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-5 md:grid-cols-2">
          {LIST_FIELDS.map(({ key, label, placeholder }) => (
            <div key={key} className="space-y-2">
              <Label htmlFor={key}>{label}</Label>
              <Input
                id={key}
                value={listInputs[key]}
                placeholder={placeholder}
                disabled={isDisabled}
                onChange={(event) => onListChange(key, event.target.value)}
              />
            </div>
          ))}
          {TEXT_FIELDS.map(({ key, label, placeholder }) => (
            <div key={key} className="space-y-2">
              <Label htmlFor={key}>{label}</Label>
              <Input
                id={key}
                value={fields[key]}
                placeholder={placeholder}
                disabled={isDisabled}
                onChange={(event) => onTextChange(key, event.target.value)}
              />
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Company overview</CardTitle>
          <CardDescription>
            Brief context for the AI matching brief and your company website.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="summary">Summary</Label>
            <textarea
              id="summary"
              maxLength={2000}
              rows={5}
              value={fields.summary}
              disabled={isDisabled}
              onChange={(event) => onTextChange('summary', event.target.value)}
              className="border-input placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 w-full rounded-lg border bg-transparent px-3 py-2 text-sm outline-none focus-visible:ring-3 disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="Describe the work your company delivers and the outcomes it has achieved."
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="websiteUrl">Website URL</Label>
            <Input
              id="websiteUrl"
              type="url"
              maxLength={2048}
              value={fields.websiteUrl}
              disabled={isDisabled}
              onChange={(event) => onTextChange('websiteUrl', event.target.value)}
              placeholder="https://example.com"
            />
          </div>
        </CardContent>
      </Card>
    </>
  );
}
