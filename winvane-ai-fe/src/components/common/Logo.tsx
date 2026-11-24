import * as React from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils/cn';

export interface ILogoProps {
  size?: 'sm' | 'md' | 'lg';
  showWordmark?: boolean;
  useSvgImage?: boolean;
  className?: string;
}

const SIZE_VARIANTS = {
  sm: {
    box: 'h-6 w-6 rounded-[5px] p-1',
    svg: 'h-3.5 w-3.5',
    text: 'text-sm font-medium tracking-tight',
    img: 'h-6 w-auto',
  },
  md: {
    box: 'h-7 w-7 rounded-[6px] p-1.5',
    svg: 'h-4 w-4',
    text: 'text-base font-medium tracking-tight',
    img: 'h-7 w-auto',
  },
  lg: {
    box: 'h-9 w-9 rounded-[7px] p-2',
    svg: 'h-5 w-5',
    text: 'text-xl font-medium tracking-tight',
    img: 'h-9 w-auto',
  },
} as const;

export function Logo({
  size = 'md',
  showWordmark = true,
  useSvgImage = false,
  className,
}: ILogoProps) {
  const currentSize = SIZE_VARIANTS[size];

  if (useSvgImage) {
    return (
      <Image
        src="/logo.svg"
        alt="WinVane.ai"
        width={36}
        height={36}
        className={cn('select-none', currentSize.img, className)}
        priority
      />
    );
  }

  return (
    <div className={cn('inline-flex items-center gap-2.5 select-none', className)}>
      <div
        className={cn(
          'flex items-center justify-center bg-primary text-primary-foreground shadow-sm transition-transform',
          currentSize.box
        )}
        aria-label="WinVane.ai Logo Badge"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={currentSize.svg}
        >
          {/* Exact navigation glyph from Figma */}
          <path d="M4 11.5L20 4L12.5 20L10.8 13.2L4 11.5Z" />
        </svg>
      </div>

      {showWordmark && (
        <span
          data-testid="logo-wordmark"
          className={cn('text-foreground font-sans tracking-normal', currentSize.text)}
        >
          WinVane<span className="text-primary">.ai</span>
        </span>
      )}
    </div>
  );
}
