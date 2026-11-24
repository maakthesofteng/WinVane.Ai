'use client';

import type { ChangeEvent } from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';

interface ICompanyBrainPdfUploadProps {
  status: 'draft' | 'confirmed';
  version: number;
  canEdit: boolean;
  isExtracting: boolean;
  message: string;
  error: string;
  onUpload: (event: ChangeEvent<HTMLInputElement>) => void;
}

export function CompanyBrainPdfUpload({
  status,
  version,
  canEdit,
  isExtracting,
  message,
  error,
  onUpload,
}: ICompanyBrainPdfUploadProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1">
            <CardTitle>Build your company profile</CardTitle>
            <CardDescription>
              Add your company’s delivery history and capabilities. These details will inform
              prospect matching.
            </CardDescription>
          </div>
          <Badge variant={status === 'confirmed' ? 'default' : 'outline'}>
            {status === 'confirmed' ? 'Confirmed' : 'Draft'}
            {version > 0 && ` · v${version}`}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="border-border bg-muted/30 flex flex-col gap-3 rounded-lg border border-dashed p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium">Fill details from a company profile PDF</p>
            <p className="text-muted-foreground mt-1 text-xs">
              Text-based PDFs up to 5 MB. Extracted values are reviewed here and are not saved
              automatically.
            </p>
          </div>
          {canEdit && (
            <Label className="border-border bg-background hover:bg-muted inline-flex h-8 cursor-pointer items-center justify-center rounded-lg border px-3 text-sm font-medium">
              {isExtracting ? 'Extracting…' : 'Choose PDF'}
              <input
                type="file"
                accept="application/pdf,.pdf"
                className="sr-only"
                disabled={isExtracting}
                onChange={onUpload}
              />
            </Label>
          )}
        </div>
        {message && (
          <p role="status" className="text-primary text-sm">
            {message}
          </p>
        )}
        {error && (
          <p role="alert" className="text-destructive text-sm">
            {error}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
