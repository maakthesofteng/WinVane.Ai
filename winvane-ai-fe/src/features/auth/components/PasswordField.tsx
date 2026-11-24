'use client';

import * as React from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils/cn';

export interface IPasswordFieldProps
  extends Omit<React.ComponentProps<'input'>, 'type'> {
  error?: boolean;
}

export const PasswordField = React.forwardRef<HTMLInputElement, IPasswordFieldProps>(
  ({ className, disabled, error, ...props }, ref) => {
    const [showPassword, setShowPassword] = React.useState(false);

    const toggleVisibility = () => {
      setShowPassword((prev) => !prev);
    };

    return (
      <div className="relative flex items-center">
        <Input
          ref={ref}
          type={showPassword ? 'text' : 'password'}
          disabled={disabled}
          aria-invalid={error}
          className={cn('pr-10', className)}
          {...props}
        />
        <button
          type="button"
          onClick={toggleVisibility}
          disabled={disabled}
          tabIndex={-1}
          aria-label={showPassword ? 'Hide password' : 'Show password'}
          className="absolute right-2.5 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
        >
          {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
        </button>
      </div>
    );
  }
);

PasswordField.displayName = 'PasswordField';

