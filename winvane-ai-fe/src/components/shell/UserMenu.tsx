'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ShieldCheck, LogOut, ChevronDown } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { selectCurrentUser, sessionCleared } from '@/store/slices/authSlice';
import { authEvents } from '@/lib/api/authEvents';
import { clearCsrfToken } from '@/lib/api/csrf';

export interface IUserMenuProps {
  securityHref: string;
  loginHref: string;
  onLogoutMutation?: () => Promise<unknown>;
}

export function UserMenu({
  securityHref,
  loginHref,
  onLogoutMutation,
}: IUserMenuProps) {
  const router = useRouter();
  const dispatch = useDispatch();
  const queryClient = useQueryClient();
  const user = useSelector(selectCurrentUser);
  const fullName = user?.fullName;
  const [isLoggingOut, setIsLoggingOut] = React.useState(false);

  const initials = React.useMemo(() => {
    if (!fullName) return 'U';
    const parts = fullName.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  }, [fullName]);

  const handleSignOut = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    authEvents.setLoggingOut(true);

    try {
      await queryClient.cancelQueries();
      if (onLogoutMutation) {
        await onLogoutMutation();
      }
    } catch {
      // Clear client state even if network or logout API fails
    } finally {
      clearCsrfToken();
      dispatch(sessionCleared());
      queryClient.clear();
      toast.success('Signed out successfully.');
      router.replace(loginHref);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            className="flex items-center gap-2.5 rounded-full p-1 pr-2 hover:bg-muted/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            aria-label="Open user menu"
          >
            <Avatar className="h-8 w-8 border border-primary/20 bg-primary/10">
              <AvatarFallback className="text-xs font-semibold text-primary">
                {initials}
              </AvatarFallback>
            </Avatar>
            <span className="hidden text-xs font-medium text-foreground sm:inline-block max-w-[120px] truncate">
              {user?.fullName ?? 'Account'}
            </span>
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
          </Button>
        }
      />

      <DropdownMenuContent
        align="end"
        className="w-64 p-1.5 shadow-xl border-border/80 bg-card"
      >
        <DropdownMenuGroup>
          <DropdownMenuLabel className="p-2 font-normal">
            <div className="flex flex-col space-y-1">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-semibold text-foreground truncate">
                  {user?.fullName ?? 'User'}
                </p>
                {user?.role && (
                  <Badge
                    variant="outline"
                    className="border-primary/40 text-[10px] text-primary shrink-0"
                  >
                    {user.role}
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
            </div>
          </DropdownMenuLabel>
        </DropdownMenuGroup>

        <DropdownMenuSeparator />

        <DropdownMenuGroup>
          <DropdownMenuItem
            render={
              <Link
                href={securityHref}
                className="flex w-full cursor-pointer items-center gap-2.5 px-2.5 py-2 text-sm text-foreground hover:bg-muted/70 rounded-md"
              >
                <ShieldCheck className="h-4 w-4 text-primary" aria-hidden="true" />
                <span>Security settings</span>
              </Link>
            }
          />
        </DropdownMenuGroup>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          disabled={isLoggingOut}
          onClick={handleSignOut}
          className="flex cursor-pointer items-center gap-2.5 px-2.5 py-2 text-sm text-destructive hover:bg-destructive/10 hover:text-destructive rounded-md"
        >
          <LogOut className="h-4 w-4" aria-hidden="true" />
          <span>{isLoggingOut ? 'Signing out...' : 'Sign out'}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
