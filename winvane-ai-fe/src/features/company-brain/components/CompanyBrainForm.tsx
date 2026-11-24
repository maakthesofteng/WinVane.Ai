'use client';

import * as React from 'react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { CompanyBrainCaseStudiesSection } from './CompanyBrainCaseStudiesSection';
import { CompanyBrainContactsSection } from './CompanyBrainContactsSection';
import { CompanyBrainPdfUpload } from './CompanyBrainPdfUpload';
import { CompanyBrainProfileFields } from './CompanyBrainProfileFields';
import type {
  ICompanyBrain,
  ICompanyBrainExtraction,
  IUpdateCompanyBrainPayload,
} from '../types/companyBrain.types';
import {
  getFields,
  getListInputs,
  LIST_KEYS,
  splitList,
  TEXT_KEYS,
  withoutClientId,
} from './companyBrainForm.utils';

interface ICompanyBrainFormProps {
  profile: ICompanyBrain;
  canEdit: boolean;
  isSaving: boolean;
  isExtracting: boolean;
  saveError?: string;
  onSave: (payload: IUpdateCompanyBrainPayload) => void;
  onExtract: (file: File) => Promise<ICompanyBrainExtraction>;
}

export function CompanyBrainForm({
  profile,
  canEdit,
  isSaving,
  isExtracting,
  saveError,
  onSave,
  onExtract,
}: ICompanyBrainFormProps) {
  const [fields, setFields] = useState(() => getFields(profile));
  const [listInputs, setListInputs] = useState(() => getListInputs(profile));
  const [contacts, setContacts] = useState(profile.contacts);
  const [caseStudies, setCaseStudies] = useState(profile.caseStudies);
  const [extractMessage, setExtractMessage] = useState('');
  const [extractError, setExtractError] = useState('');

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    setExtractMessage('');
    setExtractError('');
    if (!file) return;

    try {
      const {
        fields: extracted,
        contacts: extractedContacts,
        caseStudies: extractedCaseStudies,
        foundFields,
      } = await onExtract(file);
      setFields((current) => {
        const next = { ...current };
        for (const key of LIST_KEYS) {
          if (next[key].length === 0 && extracted[key]?.length) {
            next[key] = extracted[key];
          }
        }
        for (const key of TEXT_KEYS) {
          if (!next[key] && extracted[key]) {
            next[key] = extracted[key];
          }
        }
        return next;
      });
      setContacts((current) =>
        current.length > 0
          ? current
          : extractedContacts.map((contact) => ({
              id: crypto.randomUUID(),
              ...contact,
            }))
      );
      setCaseStudies((current) =>
        current.length > 0
          ? current
          : extractedCaseStudies.map((caseStudy) => ({
              id: crypto.randomUUID(),
              ...caseStudy,
            }))
      );
      setListInputs((current) => {
        const next = { ...current };
        for (const key of LIST_KEYS) {
          if (!next[key].trim() && extracted[key]?.length) {
            next[key] = extracted[key].join(', ');
          }
        }
        return next;
      });
      setExtractMessage(
        `${foundFields} field${foundFields === 1 ? '' : 's'} extracted. Review the values before saving.`
      );
    } catch (error) {
      setExtractError(error instanceof Error ? error.message : 'PDF extraction failed.');
    }
  };

  const save = (status: IUpdateCompanyBrainPayload['status']) => {
    const lists = {
      techStacks: splitList(listInputs.techStacks),
      industries: splitList(listInputs.industries),
      services: splitList(listInputs.services),
      targetRegions: splitList(listInputs.targetRegions),
    };
    onSave({
      ...fields,
      ...lists,
      contacts: contacts.map(withoutClientId),
      caseStudies: caseStudies.map(withoutClientId),
      status,
    });
  };

  return (
    <div className="space-y-6">
      <CompanyBrainPdfUpload
        status={profile.status}
        version={profile.version}
        canEdit={canEdit}
        isExtracting={isExtracting}
        message={extractMessage}
        error={extractError}
        onUpload={handleUpload}
      />

      <CompanyBrainProfileFields
        fields={fields}
        listInputs={listInputs}
        canEdit={canEdit}
        isSaving={isSaving}
        onListChange={(key, value) => setListInputs((current) => ({ ...current, [key]: value }))}
        onTextChange={(key, value) => setFields((current) => ({ ...current, [key]: value }))}
      />

      <CompanyBrainContactsSection
        contacts={contacts}
        disabled={!canEdit || isSaving}
        onChange={setContacts}
      />

      <CompanyBrainCaseStudiesSection
        caseStudies={caseStudies}
        disabled={!canEdit || isSaving}
        onChange={setCaseStudies}
      />

      {saveError && (
        <p role="alert" className="text-destructive text-sm">
          {saveError}
        </p>
      )}
      {canEdit ? (
        <div className="flex flex-wrap justify-end gap-3">
          <Button type="button" variant="outline" disabled={isSaving} onClick={() => save('draft')}>
            {isSaving ? 'Saving…' : 'Save draft'}
          </Button>
          <Button type="button" disabled={isSaving} onClick={() => save('confirmed')}>
            Confirm Company Brain
          </Button>
        </div>
      ) : (
        <p className="text-muted-foreground text-sm">
          You have read-only access. Ask a workspace administrator to update the Company Brain.
        </p>
      )}
    </div>
  );
}
