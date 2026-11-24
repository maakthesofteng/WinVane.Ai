'use client';

import * as React from 'react';
import type { ColumnDef, SortingState } from '@tanstack/react-table';
import { MoreHorizontal, ArrowUpDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DataTable } from '@/components/common/DataTable';
import { StatusBadge } from '@/components/common/StatusBadge';
import { UserAvatar } from '@/components/common/UserAvatar';
import { useTableParams } from '@/hooks/useTableParams';

interface IDemoUser {
  id: string;
  name: string;
  email: string;
  role: string;
  status: 'active' | 'invited' | 'inactive';
  department: string;
}

const TOTAL_DEMO_ROWS = 134;
const ALL_DEMO_ROWS: IDemoUser[] = Array.from({ length: TOTAL_DEMO_ROWS }, (_, i) => {
  const id = `user-${i + 1}`;
  const status: IDemoUser['status'] = i % 7 === 0 ? 'invited' : i % 5 === 0 ? 'inactive' : 'active';
  const role = i === 0 ? 'Owner' : i % 3 === 0 ? 'Admin' : 'Member';
  const department = i % 4 === 0 ? 'Engineering' : i % 3 === 0 ? 'Design' : 'Product';
  return {
    id,
    name: `Team Member ${i + 1}`,
    email: `member${i + 1}@winvane.ai`,
    role,
    status,
    department,
  };
});

export function UiKitTableDemo() {
  const { params, searchInput, setSearchInput, setPage, setPageSize, setSorting } = useTableParams({
    defaults: { pageSize: 10, sortBy: 'name', sortDir: 'asc' },
    allowedSort: ['name', 'email', 'role', 'status', 'department'],
    allowedPageSizes: [10, 20, 50, 100],
  });

  const [isLoading, setIsLoading] = React.useState(true);
  const [isFetching, setIsFetching] = React.useState(false);
  const [data, setData] = React.useState<IDemoUser[]>([]);
  const [total, setTotal] = React.useState(0);

  // Simulated server fetch with 400ms delay
  React.useEffect(() => {
    let active = true;
    const fetchTimer = setTimeout(() => {
      if (active) setIsFetching(true);
    }, 0);

    const timer = setTimeout(() => {
      if (!active) return;
      let filtered = ALL_DEMO_ROWS;
      if (params.search) {
        const query = params.search.toLowerCase();
        filtered = filtered.filter(
          (u) => u.name.toLowerCase().includes(query) || u.email.toLowerCase().includes(query)
        );
      }

      if (params.sortBy) {
        const sortKey = params.sortBy as keyof IDemoUser;
        filtered = [...filtered].sort((a, b) => {
          const valA = String(a[sortKey] ?? '');
          const valB = String(b[sortKey] ?? '');
          return params.sortDir === 'desc'
            ? valB.localeCompare(valA)
            : valA.localeCompare(valB);
        });
      }

      setTotal(filtered.length);
      const start = (params.page - 1) * params.pageSize;
      setData(filtered.slice(start, start + params.pageSize));
      setIsLoading(false);
      setIsFetching(false);
    }, 400);

    return () => {
      active = false;
      clearTimeout(fetchTimer);
      clearTimeout(timer);
    };
  }, [params.page, params.pageSize, params.search, params.sortBy, params.sortDir]);

  const columns = React.useMemo<ColumnDef<IDemoUser>[]>(
    () => [
      {
        accessorKey: 'name',
        header: ({ column }) => (
          <Button
            variant="ghost"
            size="sm"
            className="-ml-3 h-8"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            Member
            <ArrowUpDown className="ml-1.5 h-3.5 w-3.5" />
          </Button>
        ),
        cell: ({ row }) => (
          <div className="flex items-center gap-3">
            <UserAvatar name={row.original.name} size="sm" />
            <div>
              <p className="font-medium text-foreground">{row.original.name}</p>
              <p className="text-xs text-muted-foreground">{row.original.email}</p>
            </div>
          </div>
        ),
        meta: { mobileLabel: 'Member' },
      },
      {
        accessorKey: 'role',
        header: 'Role',
        cell: ({ row }) => <span className="text-sm font-medium">{row.original.role}</span>,
        meta: { mobileLabel: 'Role' },
      },
      {
        accessorKey: 'department',
        header: 'Department',
        cell: ({ row }) => <span className="text-sm text-muted-foreground">{row.original.department}</span>,
        meta: { mobileLabel: 'Department' },
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => <StatusBadge status={row.original.status} />,
        meta: { mobileLabel: 'Status' },
      },
    ],
    []
  );

  const sorting: SortingState = params.sortBy
    ? [{ id: params.sortBy, desc: params.sortDir === 'desc' }]
    : [];

  return (
    <div className="space-y-4 rounded-xl border border-border/60 bg-card p-6">
      <h3 className="text-lg font-semibold text-foreground">Server-Paginated Data Table</h3>
      <p className="text-sm text-muted-foreground">
        Demonstrates DataTable with 134 fake rows, TanStack Table, responsive cards on mobile (&lt; 768px), and URL query parameter sync.
      </p>

      <DataTable
        columns={columns}
        data={data}
        total={total}
        page={params.page}
        pageSize={params.pageSize}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
        sorting={sorting}
        onSortingChange={(nextSorting) => {
          if (nextSorting.length > 0) {
            setSorting(nextSorting[0].id, nextSorting[0].desc ? 'desc' : 'asc');
          } else {
            setSorting(undefined, undefined);
          }
        }}
        isLoading={isLoading}
        isFetching={isFetching}
        getRowId={(row) => row.id}
        toolbar={
          <div className="w-full sm:w-72">
            <Input
              placeholder="Search members..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </div>
        }
        rowActions={() => (
          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        )}
      />
    </div>
  );
}
