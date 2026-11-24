import * as React from 'react';
import type { Metadata } from 'next';
import { Loader2 } from 'lucide-react';
import { AcceptInviteForm } from '@/features/members/components/AcceptInviteForm';

export const metadata: Metadata = {
  title: 'Accept Invitation',
  robots: {
    index: false,
    follow: false,
  },
};

export default function AcceptInvitePage() {
  return (
    <React.Suspense
      fallback={
        <div className="flex justify-center p-8">
          <Loader2 className="size-6 animate-spin text-primary" />
        </div>
      }
    >
      <AcceptInviteForm />
    </React.Suspense>
  );
}
