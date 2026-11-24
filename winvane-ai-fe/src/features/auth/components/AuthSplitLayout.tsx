'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { HelpCircle } from 'lucide-react';
import { Logo } from '@/components/common/Logo';
import { ROUTES } from '@/constants/routes';
import { AuthShowcaseSlider } from './AuthShowcaseSlider';

export interface IAuthSplitLayoutProps {
  children: React.ReactNode;
}

export function AuthSplitLayout({ children }: IAuthSplitLayoutProps) {
  const pathname = usePathname();

  const isRegister = pathname === ROUTES.REGISTER;
  const isLogin = pathname === ROUTES.LOGIN;

  return (
    <div className="auth-split-container">
      {/* Left side showcase slider: visible on desktop (lg+), matching Figma 520px template */}
      <AuthShowcaseSlider />

      {/* Right side authentication area: scrollable, responsive, max-w-440px form */}
      <main className="auth-right-section" id="auth-main-content">
        {/* Top bar with mobile logo and account navigation */}
        <header className="auth-top-bar">
          <div className="lg:hidden">
            <Logo size="md" />
          </div>

          <div className="flex items-center gap-2 text-xs ml-auto">
            {isLogin ? (
              <>
                <span className="text-muted-foreground hidden sm:inline">New to WinVane?</span>
                <Link href={ROUTES.REGISTER} className="auth-link font-medium">
                  Create business account &rarr;
                </Link>
              </>
            ) : isRegister ? (
              <>
                <span className="text-muted-foreground hidden sm:inline">Already have an account?</span>
                <Link href={ROUTES.LOGIN} className="auth-link font-medium">
                  Sign in &rarr;
                </Link>
              </>
            ) : (
              <Link href={ROUTES.LOGIN} className="auth-link-subtle text-xs">
                Back to sign in &rarr;
              </Link>
            )}
          </div>
        </header>

        {/* Form container with smooth vertical scrolling for long content (like register) */}
        <div className="auth-scroll-body">
          <div className="auth-form-card">{children}</div>
        </div>

        {/* Bottom Support and Legal footer from Figma */}
        <footer className="auth-bottom-bar">
          <a
            href="mailto:support@winvane.ai"
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <HelpCircle className="size-3.5" aria-hidden="true" />
            <span>Need help? Contact support</span>
          </a>

          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <a href="#" className="hover:text-foreground transition-colors">
              Privacy
            </a>
            <a href="#" className="hover:text-foreground transition-colors">
              Terms
            </a>
          </div>
        </footer>
      </main>
    </div>
  );
}

