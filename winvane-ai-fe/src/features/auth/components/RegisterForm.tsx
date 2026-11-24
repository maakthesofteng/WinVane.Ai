'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowRight, Building2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { isFreeEmailDomain } from '@/shared/schemas/freeEmailDomains';
import { registerSchema, type TRegisterInput } from '@/shared/schemas/auth.schema';
import { useRegister } from '../hooks/useRegister';
import { CheckInboxNotice } from './CheckInboxNotice';
import { FormErrorAlert } from './FormErrorAlert';
import { PasswordField } from './PasswordField';
import { PasswordRequirements } from './PasswordRequirements';
import { RegisterTermsCheckbox } from './RegisterTermsCheckbox';

export function RegisterForm() {
  const [registeredEmail, setRegisteredEmail] = React.useState<string | null>(null);
  const { mutate: register, isPending, error } = useRegister();

  const {
    register: formRegister,
    handleSubmit,
    watch,
    setError,
    formState: { errors },
  } = useForm<TRegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      companyName: '',
      fullName: '',
      email: '',
      password: '',
      confirmPassword: '',
      acceptTerms: false,
    },
    mode: 'onTouched',
  });

  const emailValue = watch('email');
  const passwordValue = watch('password');
  const isFreeEmail = isFreeEmailDomain(emailValue);

  const onSubmit = (values: TRegisterInput) => {
    register(
      {
        companyName: values.companyName,
        fullName: values.fullName,
        email: values.email,
        password: values.password,
      },
      {
        onSuccess: () => {
          toast.success('Account created! Please check your email to verify your address.');
          setRegisteredEmail(values.email);
        },
        onError: (err) => {
          if (err.code === 'FREE_EMAIL_DOMAIN') {
            const msg = 'Personal email addresses are not permitted. Please use your work email.';
            setError('email', { type: 'manual', message: msg });
            toast.error(msg);
          } else if (err.code === 'PASSWORD_POLICY') {
            const msg = err.messages.join('. ') || 'Password does not satisfy the security policy.';
            setError('password', { type: 'manual', message: msg });
            toast.error(msg);
          } else {
            toast.error(err.messages.join('. ') || 'Unable to create account. Please try again.');
          }
        },
      }
    );
  };

  if (registeredEmail) {
    return <CheckInboxNotice email={registeredEmail} />;
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="auth-form" noValidate>
      {error && error.code !== 'FREE_EMAIL_DOMAIN' && error.code !== 'PASSWORD_POLICY' && (
        <FormErrorAlert error={error} />
      )}

      <div className="auth-form-group">
        <Label htmlFor="companyName" className="auth-label">Company name</Label>
        <Input
          id="companyName"
          autoComplete="organization"
          placeholder="Acme Corp"
          disabled={isPending}
          aria-invalid={Boolean(errors.companyName)}
          {...formRegister('companyName')}
        />
        {errors.companyName && (
          <p className="auth-field-error">{errors.companyName.message}</p>
        )}
      </div>

      <div className="auth-form-group">
        <Label htmlFor="fullName" className="auth-label">Your full name</Label>
        <Input
          id="fullName"
          autoComplete="name"
          placeholder="Jane Doe"
          disabled={isPending}
          aria-invalid={Boolean(errors.fullName)}
          {...formRegister('fullName')}
        />
        {errors.fullName && (
          <p className="auth-field-error">{errors.fullName.message}</p>
        )}
      </div>

      <div className="auth-form-group">
        <Label htmlFor="email" className="auth-label">Work email</Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          placeholder="you@company.com"
          disabled={isPending}
          aria-invalid={Boolean(errors.email)}
          {...formRegister('email')}
        />
        {isFreeEmail && !errors.email && (
          <p className="auth-hint text-amber-400">
            Use your company email — personal addresses can&apos;t create a workspace.
          </p>
        )}
        {errors.email && <p className="auth-field-error">{errors.email.message}</p>}
      </div>

      <div className="auth-form-group">
        <Label htmlFor="password" className="auth-label">Password</Label>
        <PasswordField
          id="password"
          autoComplete="new-password"
          placeholder="••••••••••••"
          disabled={isPending}
          error={Boolean(errors.password)}
          {...formRegister('password')}
        />
        <PasswordRequirements password={passwordValue} email={emailValue} />
        {errors.password && (
          <p className="auth-field-error">{errors.password.message}</p>
        )}
      </div>

      <div className="auth-form-group">
        <Label htmlFor="confirmPassword" className="auth-label">Confirm password</Label>
        <PasswordField
          id="confirmPassword"
          autoComplete="new-password"
          placeholder="••••••••••••"
          disabled={isPending}
          error={Boolean(errors.confirmPassword)}
          {...formRegister('confirmPassword')}
        />
        {errors.confirmPassword && (
          <p className="auth-field-error">{errors.confirmPassword.message}</p>
        )}
      </div>

      <div className="auth-guidance-panel">
        <Building2 className="size-4 text-primary shrink-0 mt-0.5" aria-hidden="true" />
        <p>Company workspace: Your business email domain defines your tenant boundary.</p>
      </div>

      <RegisterTermsCheckbox
        registration={formRegister('acceptTerms')}
        disabled={isPending}
        error={errors.acceptTerms?.message}
      />

      <button type="submit" disabled={isPending} className="auth-button-primary mt-1">
        {isPending ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            Creating workspace...
          </>
        ) : (
          <>
            Create business account
            <ArrowRight className="size-4" />
          </>
        )}
      </button>
    </form>
  );
}
