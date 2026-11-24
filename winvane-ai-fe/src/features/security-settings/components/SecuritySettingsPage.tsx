'use client';

import * as React from 'react';
import { PageHeader } from '@/components/common/PageHeader';
import { ChangePasswordCard } from './ChangePasswordCard';
import { TwoFactorCard } from './TwoFactorCard';
import { ActiveSessionsCard } from './ActiveSessionsCard';
import type { TPortal } from '../types/securityApi.types';

export interface ISecuritySettingsPageProps {
  portal: TPortal;
}

export function SecuritySettingsPage({ portal }: ISecuritySettingsPageProps) {
  return (
    <div className="space-y-8 max-w-4xl">
      <PageHeader
        title="Security"
        description="Manage your password, two-factor authentication, and signed-in devices."
      />

      <div className="space-y-6">
        <ChangePasswordCard portal={portal} />
        <TwoFactorCard portal={portal} />
        <ActiveSessionsCard portal={portal} />
      </div>
    </div>
  );
}

