import type { Metadata } from 'next';
import { AuthCard, ForgotPasswordForm } from '@/features/auth';

export const metadata: Metadata = {
  title: 'Forgot password',
};

export default function ForgotPasswordPage() {
  return (
    <AuthCard
      overline="PASSWORD RECOVERY"
      title="Forgot your password?"
      subtitle="Enter your email address and we'll send you a recovery link."
    >
      <ForgotPasswordForm />
    </AuthCard>
  );
}
