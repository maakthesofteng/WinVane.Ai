import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Logo } from '@/components/common/Logo';
import { PageHeader } from '@/components/common/PageHeader';
import { UiKitComponentsDemo } from './components/UiKitComponentsDemo';
import { UiKitFormDemo } from './components/UiKitFormDemo';
import { UiKitLiveTest } from './components/UiKitLiveTest';
import { UiKitModalDemo } from './components/UiKitModalDemo';
import { UiKitTableDemo } from './components/UiKitTableDemo';
import { UiKitSelectPhoneDemo } from './components/UiKitSelectPhoneDemo';

export const metadata: Metadata = {
  title: 'Design System & UI Kit',
};

export default function UiKitPage() {
  if (process.env.NODE_ENV === 'production') {
    notFound();
  }

  return (
    <div className="min-h-screen bg-background p-6 lg:p-12 space-y-12 max-w-6xl mx-auto">
      <div className="flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Logo size="lg" />
          <p className="mt-2 text-sm text-muted-foreground">
            Dark Navy (`#0B1220`) & Mint (`#3DDC97`) Design System Verification
          </p>
        </div>
      </div>

      <section className="space-y-4">
        <PageHeader
          title="Interactive API & CSRF Verification"
          description="Dev-only testing tools to verify GET /health and CSRF double-submit token cycle against backend."
        />
        <UiKitLiveTest />
      </section>

      <section className="space-y-4">
        <PageHeader
          title="Modals & Confirm Dialogs"
          description="Standard pop-up modal sizes, dirty state discard prompt, and useConfirm() hook."
        />
        <UiKitModalDemo />
      </section>

      <section className="space-y-4">
        <PageHeader
          title="Server-Paginated Data Table"
          description="DataTable with 134 fake rows, URL search params sync, sorting, and mobile responsive cards."
        />
        <UiKitTableDemo />
      </section>

      <section className="space-y-4">
        <PageHeader
          title="Selects, Phone Input & Indicators"
          description="Searchable single and multi selects, international phone input with country detection, and badges."
        />
        <UiKitSelectPhoneDemo />
      </section>

      <section className="space-y-4">
        <PageHeader
          title="Primitives & Component States"
          description="Shadcn UI primitives themed with dark navy and mint accent."
        />
        <UiKitComponentsDemo />
      </section>

      <section className="space-y-4">
        <PageHeader
          title="Form Handling Pattern Template"
          description="React Hook Form + Zod resolver + field-level and server-level error presentation."
        />
        <UiKitFormDemo />
      </section>
    </div>
  );
}
