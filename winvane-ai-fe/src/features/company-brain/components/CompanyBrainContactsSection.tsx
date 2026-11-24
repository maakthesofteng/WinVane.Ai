'use client';

import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { ICompanyBrainContact } from '../types/companyBrain.types';

interface ICompanyBrainContactsSectionProps {
  contacts: ICompanyBrainContact[];
  disabled: boolean;
  onChange: (contacts: ICompanyBrainContact[]) => void;
}

export function CompanyBrainContactsSection({
  contacts,
  disabled,
  onChange,
}: ICompanyBrainContactsSectionProps) {
  const updateContact = (
    id: string,
    key: keyof Omit<ICompanyBrainContact, 'id'>,
    value: string
  ) => {
    onChange(
      contacts.map((contact) => (contact.id === id ? { ...contact, [key]: value } : contact))
    );
  };

  const addContact = () => {
    onChange([
      ...contacts,
      {
        id: crypto.randomUUID(),
        name: '',
        workEmail: '',
        contactNumber: '',
        jobTitle: '',
      },
    ]);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <CardTitle>Company employees and contacts</CardTitle>
            <CardDescription>
              Add the people who represent or deliver work for your company. Work email is required.
            </CardDescription>
          </div>
          {!disabled && (
            <Button type="button" variant="outline" size="sm" onClick={addContact}>
              <Plus />
              Add person
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {contacts.length === 0 && (
          <p className="text-muted-foreground text-sm">No employee contacts added yet.</p>
        )}
        {contacts.map((contact, index) => (
          <div key={contact.id} className="border-border rounded-lg border p-4">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm font-medium">Contact {index + 1}</p>
              {!disabled && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`Remove contact ${index + 1}`}
                  onClick={() => onChange(contacts.filter((item) => item.id !== contact.id))}
                >
                  <Trash2 />
                </Button>
              )}
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor={`contact-name-${contact.id}`}>Name</Label>
                <Input
                  id={`contact-name-${contact.id}`}
                  maxLength={120}
                  required
                  value={contact.name}
                  disabled={disabled}
                  onChange={(event) => updateContact(contact.id, 'name', event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor={`contact-email-${contact.id}`}>Work email</Label>
                <Input
                  id={`contact-email-${contact.id}`}
                  type="email"
                  maxLength={254}
                  required
                  value={contact.workEmail}
                  disabled={disabled}
                  onChange={(event) => updateContact(contact.id, 'workEmail', event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor={`contact-phone-${contact.id}`}>Contact number</Label>
                <Input
                  id={`contact-phone-${contact.id}`}
                  type="tel"
                  maxLength={32}
                  value={contact.contactNumber}
                  disabled={disabled}
                  onChange={(event) =>
                    updateContact(contact.id, 'contactNumber', event.target.value)
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor={`contact-title-${contact.id}`}>Job title</Label>
                <Input
                  id={`contact-title-${contact.id}`}
                  maxLength={120}
                  value={contact.jobTitle}
                  disabled={disabled}
                  onChange={(event) => updateContact(contact.id, 'jobTitle', event.target.value)}
                />
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
