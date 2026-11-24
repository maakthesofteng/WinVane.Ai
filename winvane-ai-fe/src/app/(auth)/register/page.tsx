import type { Metadata } from 'next';
import { AuthCard, RegisterForm } from '@/features/auth';

export const metadata: Metadata = {
  title: 'Create business account',
};

export default function RegisterPage() {
  return (
    <AuthCard
      overline="GET STARTED · ACCOUNT → VERIFY EMAIL → COMPANY BRAIN"
      title="Create business account"
      subtitle="Start with your business email. After verification, build your Company Brain to discover leads that fit."
    >
      <RegisterForm />
    </AuthCard>
  );
}
