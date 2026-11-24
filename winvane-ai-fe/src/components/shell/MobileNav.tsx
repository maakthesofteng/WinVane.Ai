'use client';

import * as React from 'react';
import Link from 'next/link';
import { Menu } from 'lucide-react';
import { useSelector } from 'react-redux';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/common/Logo';
import { SidebarNavItem } from './SidebarNavItem';
import { selectCurrentUser } from '@/store/slices/authSlice';
import type { INavItem } from './shell.types';

export interface IMobileNavProps {
  items: INavItem[];
  homeHref: string;
  headerSlot?: React.ReactNode;
}

export function MobileNav({ items, homeHref, headerSlot }: IMobileNavProps) {
  const [open, setOpen] = React.useState(false);
  const user = useSelector(selectCurrentUser);

  const visibleItems = React.useMemo(() => {
    return items.filter((item) => {
      if (!item.permission) return true;
      if (!user) return false;
      if (user.role === 'SuperAdmin' || user.role === 'Owner' || user.isPlatformRole) return true;
      const required = Array.isArray(item.permission) ? item.permission : [item.permission];
      return required.some((perm) => user.permissions?.includes(perm));
    });
  }, [items, user]);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden text-muted-foreground hover:text-foreground"
            aria-label="Open navigation menu"
          >
            <Menu className="h-5 w-5" aria-hidden="true" />
          </Button>
        }
      />
      <SheetContent side="left" className="w-72 p-0 bg-card border-r border-border/70">
        <SheetHeader className="flex h-16 flex-row items-center justify-between border-b border-border/60 px-4">
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <Link
            href={homeHref}
            onClick={() => setOpen(false)}
            className="flex items-center gap-2"
          >
            <Logo size="sm" />
          </Link>
          {headerSlot}
        </SheetHeader>
        <nav className="space-y-1 p-4" aria-label="Mobile navigation">
          {visibleItems.map((item, index) => {
            const prevItem = index > 0 ? visibleItems[index - 1] : undefined;
            const showSection = Boolean(
              item.section && item.section !== prevItem?.section
            );

            return (
              <React.Fragment key={item.href}>
                {showSection && (
                  <div className="px-3 pt-3 pb-1 text-[11px] font-semibold text-muted-foreground/70 uppercase tracking-wider select-none">
                    {item.section}
                  </div>
                )}
                <SidebarNavItem
                  item={item}
                  onClick={() => setOpen(false)}
                />
              </React.Fragment>
            );
          })}
        </nav>
      </SheetContent>
    </Sheet>
  );
}
