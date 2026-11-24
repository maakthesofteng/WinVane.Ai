'use client';

import * as React from 'react';
import { Check, Dot } from 'lucide-react';
import { PASSWORD_RULES } from '@/shared/schemas/password.schema';
import { cn } from '@/lib/utils/cn';

export interface IPasswordRequirementsProps {
  password?: string;
  email?: string;
  className?: string;
}

export function PasswordRequirements({
  password = '',
  email,
  className,
}: IPasswordRequirementsProps) {
  return (
    <ul
      className={cn('password-checklist', className)}
      aria-label="Password requirements"
    >
      {PASSWORD_RULES.map((rule) => {
        const isMet = rule.validate(password, email);

        return (
          <li
            key={rule.id}
            className={cn(
              'password-req-item',
              isMet ? 'password-req-met' : 'password-req-unmet'
            )}
            aria-live="polite"
          >
            {isMet ? (
              <Check className="size-3.5 shrink-0 text-primary" aria-hidden="true" />
            ) : (
              <Dot className="size-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
            )}
            <span>{rule.label}</span>
          </li>
        );
      })}
    </ul>
  );
}

