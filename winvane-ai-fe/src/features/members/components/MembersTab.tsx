'use client';

import * as React from 'react';
import { useSelector } from 'react-redux';
import type { SortingState } from '@tanstack/react-table';
import { UserPlus, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/common/DataTable';
import { EmptyState } from '@/components/common/EmptyState';
import { useTableParams } from '@/hooks/useTableParams';
import { selectHasPermission } from '@/store/slices/authSlice';
import { useMembersList } from '../hooks/useMembersList';
import { createMembersColumns } from './membersColumns';
import { MembersToolbar } from './MembersToolbar';
import { InviteMemberModal } from './InviteMemberModal';
import { EditMemberModal } from './EditMemberModal';
import type { IMemberRow, TMemberStatus, TMembersSortBy } from '../types/members.types';

const ALLOWED_SORT_COLUMNS: string[] = [
  'fullName',
  'email',
  'role',
  'status',
  'createdAt',
  'lastLoginAt',
];

const isValidStatus = (s?: string): s is TMemberStatus =>
  s === 'active' || s === 'invited' || s === 'inactive';

const isValidSortBy = (s?: string): s is TMembersSortBy =>
  Boolean(s && ALLOWED_SORT_COLUMNS.includes(s));

export function MembersTab() {
  const canInvite = useSelector(selectHasPermission('members:invite'));

  const tableParams = useTableParams({
    defaults: {
      page: 1,
      pageSize: 10,
      sortBy: 'createdAt',
      sortDir: 'desc',
    },
    allowedSort: ALLOWED_SORT_COLUMNS,
    allowedPageSizes: [10, 20, 50, 100],
  });

  const {
    page = 1,
    pageSize = 10,
    search = '',
    sortBy = 'createdAt',
    sortDir = 'desc',
    filters = {},
    setPage,
    setPageSize,
    setSearch,
    setSort,
    setFilter,
    clearFilters,
  } = tableParams;

  const [isInviteOpen, setIsInviteOpen] = React.useState(false);
  const [editingMember, setEditingMember] = React.useState<IMemberRow | null>(null);

  const queryParams = React.useMemo(() => {
    return {
      page,
      pageSize,
      search: search || undefined,
      roleId: filters?.role || undefined,
      status: isValidStatus(filters?.status) ? filters.status : undefined,
      teamId: filters?.team || undefined,
      sortBy: isValidSortBy(sortBy) ? sortBy : 'createdAt',
      sortDir: sortDir || 'desc',
    };
  }, [page, pageSize, search, filters, sortBy, sortDir]);

  const { data, isLoading, isFetching } = useMembersList(queryParams);

  const columns = React.useMemo(() => {
    return createMembersColumns((member) => setEditingMember(member));
  }, []);

  const sorting = React.useMemo<SortingState>(() => {
    return sortBy ? [{ id: sortBy, desc: sortDir === 'desc' }] : [];
  }, [sortBy, sortDir]);

  const handleSortingChange = React.useCallback(
    (nextSorting: SortingState) => {
      if (nextSorting.length > 0) {
        setSort(nextSorting[0].id, nextSorting[0].desc ? 'desc' : 'asc');
      } else {
        setSort(undefined, undefined);
      }
    },
    [setSort]
  );

  const hasActiveFilters = Boolean(
    search || filters?.role || filters?.status || filters?.team
  );

  const items = data?.items || [];
  const total = data?.total || 0;
  const isInitialEmpty = !isLoading && total === 0 && !hasActiveFilters;
  const isFilterEmpty = !isLoading && total === 0 && hasActiveFilters;

  return (
    <div className="space-y-4">
      <MembersToolbar
        search={search}
        onSearchChange={setSearch}
        selectedRole={filters?.role}
        onRoleChange={(val) => setFilter('role', val)}
        selectedStatus={filters?.status}
        onStatusChange={(val) => setFilter('status', val)}
        selectedTeam={filters?.team}
        onTeamChange={(val) => setFilter('team', val)}
        hasActiveFilters={hasActiveFilters}
        onClearFilters={clearFilters}
        onAddMember={() => setIsInviteOpen(true)}
      />

      {isInitialEmpty ? (
        <div className="flex min-h-[360px] items-center justify-center rounded-xl border border-border/60 bg-card p-8">
          <EmptyState
            icon={<Users className="h-10 w-10 text-muted-foreground" aria-hidden="true" />}
            title="Invite your first teammate"
            description="Collaborate with your team members by inviting them to this workspace."
            action={
              canInvite ? (
                <Button onClick={() => setIsInviteOpen(true)} className="gap-2">
                  <UserPlus className="h-4 w-4" />
                  Add member
                </Button>
              ) : undefined
            }
          />
        </div>
      ) : isFilterEmpty ? (
        <div className="flex min-h-[300px] items-center justify-center rounded-xl border border-border/60 bg-card p-8">
          <EmptyState
            title="No members match your filters"
            description="Try adjusting or clearing your search or filter criteria."
            action={
              <Button variant="outline" onClick={clearFilters}>
                Clear filters
              </Button>
            }
          />
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={items}
          total={total}
          page={page}
          pageSize={pageSize}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
          sorting={sorting}
          onSortingChange={handleSortingChange}
          isLoading={isLoading}
          isFetching={isFetching && !isLoading}
          pageSizeOptions={[10, 20, 50, 100]}
        />
      )}

      {/* Modals */}
      <InviteMemberModal open={isInviteOpen} onOpenChange={setIsInviteOpen} />
      <EditMemberModal
        open={Boolean(editingMember)}
        onOpenChange={(open) => !open && setEditingMember(null)}
        member={editingMember}
      />
    </div>
  );
}

