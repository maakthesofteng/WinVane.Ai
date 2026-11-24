'use client';

import * as React from 'react';
import { SearchableSelect, type ISelectOption } from '@/components/common/SearchableSelect';
import { SearchableMultiSelect } from '@/components/common/SearchableMultiSelect';
import { PhoneInput } from '@/components/common/PhoneInput';
import { StatusBadge } from '@/components/common/StatusBadge';
import { AvatarStack } from '@/components/common/AvatarStack';

const STATIC_ROLES: ISelectOption[] = [
  { value: 'owner', label: 'Owner', description: 'Full workspace authority and billing controls' },
  { value: 'admin', label: 'Admin', description: 'Can manage members, teams, and integrations' },
  { value: 'member', label: 'Member', description: 'Standard workspace collaborator' },
  { value: 'guest', label: 'Guest', description: 'Restricted read-only access to assigned projects', disabled: true },
];

const MOCK_DEPARTMENTS: ISelectOption[] = [
  { value: 'eng', label: 'Engineering' },
  { value: 'des', label: 'Product Design' },
  { value: 'prod', label: 'Product Management' },
  { value: 'sec', label: 'Security & Compliance' },
  { value: 'ops', label: 'DevOps & Infrastructure' },
];

const DEMO_AVATARS = [
  { name: 'Sarah Chen', email: 'sarah@winvane.ai' },
  { name: 'Alex Miller', email: 'alex@winvane.ai' },
  { name: 'David Kim', email: 'david@winvane.ai' },
  { name: 'Elena Rostova', email: 'elena@winvane.ai' },
  { name: 'Marcus Brody', email: 'marcus@winvane.ai' },
  { name: 'Priya Sharma', email: 'priya@winvane.ai' },
  { name: 'Liam O’Connor', email: 'liam@winvane.ai' },
];

export function UiKitSelectPhoneDemo() {
  const [selectedRole, setSelectedRole] = React.useState<string | undefined>('admin');
  const [asyncDept, setAsyncDept] = React.useState<string | undefined>('eng');
  const [deptList, setDeptList] = React.useState<ISelectOption[]>(MOCK_DEPARTMENTS);
  const [selectedSkills, setSelectedSkills] = React.useState<string[]>(['react', 'typescript']);
  const [phone, setPhone] = React.useState('+12025550123');

  // Async mock fetch for departments
  const loadDepartments = async (query: string): Promise<ISelectOption[]> => {
    await new Promise((res) => setTimeout(res, 300));
    return deptList.filter((d) => d.label.toLowerCase().includes(query.toLowerCase()));
  };

  const handleCreateDept = async (label: string): Promise<ISelectOption> => {
    const newDept: ISelectOption = {
      value: `dept-${Date.now()}`,
      label,
    };
    setDeptList((prev) => [...prev, newDept]);
    return newDept;
  };

  return (
    <div className="space-y-6 rounded-xl border border-border/60 bg-card p-6">
      <h3 className="text-lg font-semibold text-foreground">Selects, Phone Input & Badges</h3>
      <p className="text-sm text-muted-foreground">
        Form controls built on Popover + Command, international telephone input, and status badges.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Static Select */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-foreground">Static Select with Clear</label>
          <SearchableSelect
            options={STATIC_ROLES}
            value={selectedRole}
            onChange={setSelectedRole}
            placeholder="Select a role..."
            clearable
          />
          <p className="text-xs text-muted-foreground">Selected: {selectedRole || 'None'}</p>
        </div>

        {/* Async & Creatable Select */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-foreground">Async & Creatable Select</label>
          <SearchableSelect
            loadOptions={loadDepartments}
            onCreate={handleCreateDept}
            value={asyncDept}
            onChange={setAsyncDept}
            placeholder="Search or create department..."
            searchPlaceholder="Type to search departments..."
          />
          <p className="text-xs text-muted-foreground">Selected: {asyncDept || 'None'}</p>
        </div>

        {/* Multi Select */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-foreground">Searchable Multi Select</label>
          <SearchableMultiSelect
            options={[
              { value: 'react', label: 'React.js' },
              { value: 'typescript', label: 'TypeScript' },
              { value: 'tailwind', label: 'Tailwind CSS' },
              { value: 'nextjs', label: 'Next.js' },
              { value: 'postgres', label: 'PostgreSQL' },
              { value: 'docker', label: 'Docker' },
              { value: 'graphql', label: 'GraphQL' },
            ]}
            value={selectedSkills}
            onChange={setSelectedSkills}
            placeholder="Select technologies..."
          />
          <p className="text-xs text-muted-foreground">Selected count: {selectedSkills.length}</p>
        </div>

        {/* Phone Input */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-foreground">International Phone Input (E.164)</label>
          <PhoneInput
            value={phone}
            onChange={setPhone}
            defaultCountry="US"
            placeholder="Enter phone number"
          />
          <p className="text-xs font-mono text-muted-foreground">E.164 output: {phone || '(empty)'}</p>
        </div>
      </div>

      {/* Badges and Avatars */}
      <div className="pt-4 border-t border-border/50 grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="space-y-3">
          <label className="text-xs font-medium text-foreground">Status Badges</label>
          <div className="flex flex-wrap items-center gap-3">
            <StatusBadge status="active" />
            <StatusBadge status="invited" />
            <StatusBadge status="inactive" />
          </div>
        </div>

        <div className="space-y-3">
          <label className="text-xs font-medium text-foreground">Avatar Stack (Max 5 shown)</label>
          <div className="flex items-center gap-4">
            <AvatarStack users={DEMO_AVATARS} max={5} size="md" />
            <AvatarStack users={DEMO_AVATARS.slice(0, 3)} max={5} size="sm" />
          </div>
        </div>
      </div>
    </div>
  );
}

