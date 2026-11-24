'use client';

import * as React from 'react';
import { ROUTES } from '@/constants/routes';
import { MfaCodeForm } from '@/features/auth/components/MfaCodeForm';
import { useAdminMfaVerify } from '../hooks/useAdminMfaVerify';

export function SuperAdminMfaForm() {
  const { mutate: verifyAdminMfa, isPending } = useAdminMfaVerify();

  return (
    <MfaCodeForm
      portal="admin"
      loginRoute={ROUTES.SUPERADMIN_LOGIN}
      destinationRoute={ROUTES.ADMIN_DASHBOARD}
      supportNote="Lost access to your authenticator? Contact the platform operator."
      customVerify={verifyAdminMfa}
      isCustomPending={isPending}
    />
  );
}

