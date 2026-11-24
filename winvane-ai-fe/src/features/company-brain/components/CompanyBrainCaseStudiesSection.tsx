'use client';

import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CompanyBrainRichTextEditor } from './CompanyBrainRichTextEditor';
import type { ICompanyBrainCaseStudy } from '../types/companyBrain.types';

interface ICompanyBrainCaseStudiesSectionProps {
  caseStudies: ICompanyBrainCaseStudy[];
  disabled: boolean;
  onChange: (caseStudies: ICompanyBrainCaseStudy[]) => void;
}

const EMPTY_DOCUMENT: ICompanyBrainCaseStudy['content'] = {
  type: 'doc',
  content: [{ type: 'paragraph' }],
};

export function CompanyBrainCaseStudiesSection({
  caseStudies,
  disabled,
  onChange,
}: ICompanyBrainCaseStudiesSectionProps) {
  const updateCaseStudy = (id: string, patch: Partial<ICompanyBrainCaseStudy>) => {
    onChange(
      caseStudies.map((caseStudy) => (caseStudy.id === id ? { ...caseStudy, ...patch } : caseStudy))
    );
  };

  const addCaseStudy = () => {
    onChange([
      ...caseStudies,
      {
        id: crypto.randomUUID(),
        title: '',
        clientName: '',
        industry: '',
        content: EMPTY_DOCUMENT,
      },
    ]);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <CardTitle>Company case studies</CardTitle>
            <CardDescription>
              Add multiple projects with formatted details about the challenge, solution, and
              results.
            </CardDescription>
          </div>
          {!disabled && (
            <Button type="button" variant="outline" size="sm" onClick={addCaseStudy}>
              <Plus />
              Add case study
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        {caseStudies.length === 0 && (
          <p className="text-muted-foreground text-sm">No case studies added yet.</p>
        )}
        {caseStudies.map((caseStudy, index) => (
          <section key={caseStudy.id} className="border-border space-y-4 rounded-lg border p-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">Case study {index + 1}</h3>
              {!disabled && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`Remove case study ${index + 1}`}
                  onClick={() => onChange(caseStudies.filter((item) => item.id !== caseStudy.id))}
                >
                  <Trash2 />
                </Button>
              )}
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor={`case-title-${caseStudy.id}`}>Project or case study title</Label>
                <Input
                  id={`case-title-${caseStudy.id}`}
                  maxLength={200}
                  required
                  value={caseStudy.title}
                  disabled={disabled}
                  onChange={(event) => updateCaseStudy(caseStudy.id, { title: event.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor={`case-client-${caseStudy.id}`}>Client or company</Label>
                <Input
                  id={`case-client-${caseStudy.id}`}
                  maxLength={160}
                  value={caseStudy.clientName}
                  disabled={disabled}
                  onChange={(event) =>
                    updateCaseStudy(caseStudy.id, { clientName: event.target.value })
                  }
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor={`case-industry-${caseStudy.id}`}>Industry</Label>
                <Input
                  id={`case-industry-${caseStudy.id}`}
                  maxLength={120}
                  value={caseStudy.industry}
                  disabled={disabled}
                  onChange={(event) =>
                    updateCaseStudy(caseStudy.id, { industry: event.target.value })
                  }
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Case study details</Label>
              <CompanyBrainRichTextEditor
                content={caseStudy.content}
                disabled={disabled}
                onChange={(content) => updateCaseStudy(caseStudy.id, { content })}
              />
            </div>
          </section>
        ))}
      </CardContent>
    </Card>
  );
}
