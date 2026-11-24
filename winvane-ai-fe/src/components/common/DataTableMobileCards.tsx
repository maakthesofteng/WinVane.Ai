'use client';

import * as React from 'react';
import { flexRender, type Table as TanStackTable } from '@tanstack/react-table';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from './EmptyState';

export interface IDataTableMobileCardsProps<T> {
  table: TanStackTable<T>;
  isLoading: boolean;
  pageSize: number;
  emptyState?: React.ReactNode;
  rowActions?: (row: T) => React.ReactNode;
}

export function DataTableMobileCards<T>({
  table,
  isLoading,
  pageSize,
  emptyState,
  rowActions,
}: IDataTableMobileCardsProps<T>) {
  if (isLoading) {
    return (
      <div className="block md:hidden divide-y divide-border/60">
        {Array.from({ length: pageSize }).map((_, idx) => (
          <div key={`mobile-skeleton-${idx}`} data-testid="mobile-skeleton-card" className="p-4 space-y-2">
            <Skeleton className="h-5 w-1/3" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        ))}
      </div>
    );
  }

  const rows = table.getRowModel().rows;

  if (rows.length === 0) {
    return (
      <div className="block md:hidden p-8 text-center">
        {emptyState || <EmptyState title="No records found" description="There are no items to display." />}
      </div>
    );
  }

  return (
    <div className="block md:hidden divide-y divide-border/60">
      {rows.map((row) => (
        <div key={row.id} data-testid="mobile-row-card" className="p-4 space-y-2 bg-card">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase">Item</span>
            {rowActions && <div>{rowActions(row.original)}</div>}
          </div>
          <div className="space-y-1.5 pt-1">
            {row.getVisibleCells().map((cell) => {
              const meta = cell.column.columnDef.meta;
              if (meta?.hideOnMobile) return null;
              const label = meta?.mobileLabel || cell.column.id;
              return (
                <div key={cell.id} className="flex items-center justify-between text-sm py-0.5">
                  <span className="text-xs text-muted-foreground">{label}</span>
                  <div className="font-medium text-foreground">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

