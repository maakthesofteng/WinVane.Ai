import * as React from 'react';
import type { UseFormRegisterReturn } from 'react-hook-form';
import { Label } from '@/components/ui/label';

export interface IRegisterTermsCheckboxProps {
  registration: UseFormRegisterReturn;
  disabled?: boolean;
  error?: string;
}

export function RegisterTermsCheckbox({
  registration,
  disabled,
  error,
}: IRegisterTermsCheckboxProps) {
  return (
    <div className="space-y-1">
      <div className="flex items-start gap-2 pt-1">
        <input
          id="acceptTerms"
          type="checkbox"
          disabled={disabled}
          className="mt-1 size-4 rounded border-border accent-primary focus:ring-primary"
          aria-invalid={Boolean(error)}
          {...registration}
        />
        <Label htmlFor="acceptTerms" className="text-xs text-muted-foreground leading-snug">
          I agree to the{' '}
          <a href="#" className="auth-link">
            Terms of Service
          </a>{' '}
          and{' '}
          <a href="#" className="auth-link">
            Privacy Policy
          </a>
          .
        </Label>
      </div>
      {error && <p className="auth-field-error">{error}</p>}
    </div>
  );
}

