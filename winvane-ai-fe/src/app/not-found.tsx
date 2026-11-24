import Link from 'next/link';
import { Logo } from '@/components/common/Logo';
import { Button } from '@/components/ui/button';
import { ROUTES } from '@/constants/routes';

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 text-center">
      <div className="flex flex-col items-center max-w-md space-y-6">
        <Logo size="lg" />
        <div className="space-y-2">
          <h1 className="text-4xl font-extrabold tracking-tight text-foreground">404</h1>
          <h2 className="text-xl font-semibold text-foreground">Page Not Found</h2>
          <p className="text-sm text-muted-foreground">
            The page you are looking for does not exist or has been moved.
          </p>
        </div>
        <Link href={ROUTES.HOME}>
          <Button variant="default">Return Home</Button>
        </Link>
      </div>
    </main>
  );
}

