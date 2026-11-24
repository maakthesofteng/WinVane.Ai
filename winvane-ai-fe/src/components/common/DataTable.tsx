'use client';

import * as React from 'react';
import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  type SortingState,
  useReactTable,
} from '@tanstack/react-table';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { TablePagination } from './TablePagination';
import { EmptyState } from './EmptyState';
import { DataTableMobileCards } from './DataTableMobileCards';
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

declare module '@tanstack/react-table' {
  // eslint-disable-next-line @typescript-eslint/naming-convention, @typescript-eslint/no-unused-vars
  interface ColumnMeta<TData, TValue> {
    mobileLabel?: string;
    hideOnMobile?: boolean;
  }
}

export interface IDataTableProps<T> {
  columns: ColumnDef<T, unknown>[];
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  sorting?: SortingState;
  onSortingChange?: (sorting: SortingState) => void;
  isLoading?: boolean;
  isFetching?: boolean;
  emptyState?: React.ReactNode;
  toolbar?: React.ReactNode;
  getRowId?: (row: T) => string;
  rowActions?: (row: T) => React.ReactNode;
  pageSizeOptions?: number[];
  className?: string;
}

export function DataTable<T>({
  columns,
  data,
  total,
  page,
  pageSize,
  onPageChange,
  onPageSizeChange,
  sorting,
  onSortingChange,
  isLoading = false,
  isFetching = false,
  emptyState,
  toolbar,
  getRowId,
  rowActions,
  pageSizeOptions,
  className,
}: IDataTableProps<T>) {
  const table = useReactTable({
    data,
    columns,
    state: {
      sorting: sorting || [],
      pagination: {
        pageIndex: page - 1,
        pageSize,
      },
    },
    manualPagination: true,
    manualSorting: true,
    pageCount: Math.ceil(total / pageSize),
    onSortingChange: (updater) => {
      if (onSortingChange) {
        const nextSorting = typeof updater === 'function' ? updater(sorting || []) : updater;
        onSortingChange(nextSorting);
      }
    },
    getCoreRowModel: getCoreRowModel(),
    getRowId,
  });

  const renderSortIcon = (canSort: boolean, isSorted: false | 'asc' | 'desc') => {
    if (!canSort) return null;
    if (isSorted === 'asc') return <ArrowUp className="ml-1.5 h-3.5 w-3.5" />;
    if (isSorted === 'desc') return <ArrowDown className="ml-1.5 h-3.5 w-3.5" />;
    return <ArrowUpDown className="ml-1.5 h-3.5 w-3.5 text-muted-foreground/60" />;
  };

  return (
    <div className={cn('space-y-4', className)}>
      {toolbar && <div className="flex items-center justify-between gap-4">{toolbar}</div>}

      <div className="relative rounded-xl border border-border/60 bg-card overflow-hidden">
        {/* Subtle top progress bar during background fetching */}
        {isFetching && !isLoading && (
          <div
            data-testid="data-table-fetching"
            className="absolute top-0 left-0 right-0 h-0.5 bg-primary/80 animate-pulse z-20"
          />
        )}

        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/40">
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => {
                    const canSort = header.column.getCanSort();
                    const isSorted = header.column.getIsSorted();
                    return (
                      <TableHead
                        key={header.id}
                        className={cn(
                          'text-xs font-semibold text-muted-foreground uppercase tracking-wider',
                          canSort && 'cursor-pointer select-none hover:text-foreground'
                        )}
                        onClick={header.column.getToggleSortingHandler()}
                      >
                        <div className="flex items-center">
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          {renderSortIcon(canSort, isSorted)}
                        </div>
                      </TableHead>
                    );
                  })}
                  {rowActions && <TableHead className="w-12 text-right">Actions</TableHead>}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: pageSize }).map((_, rIdx) => (
                  <TableRow key={`skeleton-row-${rIdx}`} data-testid="skeleton-row">
                    {columns.map((_, cIdx) => (
                      <TableCell key={`skeleton-cell-${cIdx}`}>
                        <Skeleton className="h-5 w-full max-w-[80%]" />
                      </TableCell>
                    ))}
                    {rowActions && (
                      <TableCell className="text-right">
                        <Skeleton className="h-5 w-6 ml-auto" />
                      </TableCell>
                    )}
                  </TableRow>
                ))
              ) : table.getRowModel().rows.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={columns.length + (rowActions ? 1 : 0)}
                    className="h-64 text-center"
                  >
                    {emptyState || <EmptyState title="No records found" description="There are no items to display." />}
                  </TableCell>
                </TableRow>
              ) : (
                table.getRowModel().rows.map((row) => (
                  <TableRow key={row.id} className="hover:bg-muted/20 transition-colors">
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id} className="text-sm">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                    {rowActions && (
                      <TableCell className="text-right">{rowActions(row.original)}</TableCell>
                    )}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Mobile Stacked Card View (< 768px) */}
        <DataTableMobileCards
          table={table}
          isLoading={isLoading}
          pageSize={pageSize}
          emptyState={emptyState}
          rowActions={rowActions}
        />
      </div>

      <TablePagination
        page={page}
        pageSize={pageSize}
        total={total}
        onPageChange={onPageChange}
        onPageSizeChange={onPageSizeChange}
        pageSizeOptions={pageSizeOptions}
      />
    </div>
  );
}
