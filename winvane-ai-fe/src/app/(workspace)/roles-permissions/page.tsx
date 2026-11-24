'use client';

import * as React from 'react';
import { RolesPermissionsPage } from '@/features/roles/components/RolesPermissionsPage';

export default function Page() {
  return (
    <React.Suspense fallback={<div className="p-8 text-center text-sm text-muted-foreground">Loading roles...</div>}>
      <RolesPermissionsPage />
    </React.Suspense>
  );
}
