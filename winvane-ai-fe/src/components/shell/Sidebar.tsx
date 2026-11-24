'use client';

import * as React from 'react';
import Link from 'next/link';
import { useDispatch, useSelector } from 'react-redux';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { Logo } from '@/components/common/Logo';
import { SidebarNavItem } from './SidebarNavItem';
import { Button } from '@/components/ui/button';
import {
  selectSidebarCollapsed,
  setSidebarCollapsed,
  toggleSidebar,
} from '@/store/slices/uiSlice';
import { selectCurrentUser } from '@/store/slices/authSlice';
import type { INavItem } from './shell.types';

export interface ISidebarProps {
  items: INavItem[];
  homeHref: string;
  headerSlot?: React.ReactNode;
  footerSlot?: React.ReactNode;
  className?: string;
}

const SIDEBAR_STORAGE_KEY = 'wv_sidebar_collapsed';

export function Sidebar({
  items,
  homeHref,
  headerSlot,
  footerSlot,
  className,
}: ISidebarProps) {
  const dispatch = useDispatch();
  const collapsed = useSelector(selectSidebarCollapsed);
  const user = useSelector(selectCurrentUser);

  React.useEffect(() => {
    try {
      const saved = localStorage.getItem(SIDEBAR_STORAGE_KEY);
      if (saved !== null) {
        dispatch(setSidebarCollapsed(saved === 'true'));
      }
    } catch {
      // Ignore storage errors (private browsing or quota limits)
    }
  }, [dispatch]);

  const handleToggle = () => {
    const next = !collapsed;
    dispatch(toggleSidebar());
    try {
      localStorage.setItem(SIDEBAR_STORAGE_KEY, String(next));
    } catch {
      // Ignore storage errors
    }
  };

  // NOTE: Permission-based navigation filtering is strictly for UX polish;
  // all access control is enforced on the server.
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
    <aside
      aria-label="Sidebar navigation"
      className={cn(
        'relative hidden flex-col border-r border-border/70 bg-card transition-all duration-200 lg:flex',
        collapsed ? 'w-16' : 'w-64',
        className
      )}
    >
      {/* Brand header */}
      <div
        className={cn(
          'flex h-16 items-center border-b border-border/60 px-4',
          collapsed ? 'justify-center' : 'justify-between'
        )}
      >
        <Link
          href={homeHref}
          className="flex items-center gap-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-md"
        >
          <Logo size="sm" showWordmark={!collapsed} />
        </Link>
        {!collapsed && headerSlot}
      </div>

      {/* Nav items */}
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4" aria-label="Main navigation">
        {visibleItems.map((item, index) => {
          const prevItem = index > 0 ? visibleItems[index - 1] : undefined;
          const showSection = Boolean(
            item.section && item.section !== prevItem?.section
          );

          return (
            <React.Fragment key={item.href}>
              {showSection && !collapsed && (
                <div
                  data-testid={`sidebar-section-${item.section!.toLowerCase().replace(/\s+/g, '-')}`}
                  className="px-3 pt-4 pb-1.5 text-[11px] font-semibold text-muted-foreground/70 uppercase tracking-wider select-none"
                >
                  {item.section}
                </div>
              )}
              {showSection && collapsed && index > 0 && (
                <div className="my-1.5 border-t border-border/40" />
              )}
              <SidebarNavItem
                item={item}
                collapsed={collapsed}
              />
            </React.Fragment>
          );
        })}
      </nav>

      {/* Footer slot & collapse toggle */}
      <div className="border-t border-border/60 p-3 space-y-2">
        {footerSlot}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleToggle}
          className={cn(
            'w-full text-muted-foreground hover:text-foreground hover:bg-muted/70',
            collapsed ? 'justify-center px-0' : 'justify-between'
          )}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {!collapsed && <span className="text-xs font-medium">Collapse</span>}
          {collapsed ? (
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
          ) : (
            <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          )}
        </Button>
      </div>
    </aside>
  );
}
