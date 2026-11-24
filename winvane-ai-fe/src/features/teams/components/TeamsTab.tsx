'use client';

import * as React from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { useConfirm } from '@/components/common/ConfirmDialog';
import { TablePagination } from '@/components/common/TablePagination';
import { useTableParams } from '@/hooks/useTableParams';
import { TeamsToolbar } from './TeamsToolbar';
import { TeamsGrid } from './TeamsGrid';
import { TeamDetailSheet } from './TeamDetailSheet';
import { TeamFormModal } from './TeamFormModal';
import { useTeamsList } from '../hooks/useTeamsList';
import { useDeleteTeam } from '../hooks/useDeleteTeam';
import type { ITeamCard, ITeamDetail, ITeamsQueryParams } from '../types/teams.types';

export function TeamsTab() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const confirm = useConfirm();

  const {
    page,
    pageSize,
    search,
    sortBy,
    sortDir,
    filters,
    setPage,
    setPageSize,
    setSearch,
    setSort,
    setFilter,
    clearFilters,
  } = useTableParams({
    defaults: {
      page: 1,
      pageSize: 12,
      sortBy: 'name',
      sortDir: 'asc',
    },
    allowedPageSizes: [12, 24, 48],
    allowedSort: ['name', 'createdAt', 'memberCount'],
  });

  const queryParams: ITeamsQueryParams = React.useMemo(() => {
    return {
      page,
      pageSize,
      search: search || undefined,
      departmentId: filters.department || undefined,
      sortBy: (sortBy as 'name' | 'createdAt' | 'memberCount') || 'name',
      sortDir: (sortDir as 'asc' | 'desc') || 'asc',
    };
  }, [page, pageSize, search, filters.department, sortBy, sortDir]);

  const { data, isLoading } = useTeamsList(queryParams);
  const deleteTeamMutation = useDeleteTeam();

  const teams = data?.items || [];
  const total = data?.total || 0;

  const [isCreateOpen, setIsCreateOpen] = React.useState(false);
  const [editingTeam, setEditingTeam] = React.useState<ITeamCard | ITeamDetail | null>(null);

  const selectedTeamId = searchParams.get('team');

  const openDetail = React.useCallback(
    (id: string) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set('team', id);
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  const closeDetail = React.useCallback(() => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete('team');
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }, [pathname, router, searchParams]);

  const handleDeleteTeam = async (team: ITeamCard | ITeamDetail) => {
    const confirmed = await confirm({
      title: `Delete team ${team.name}?`,
      description: (
        <span>
          Delete team <strong className="text-foreground">{team.name}</strong>? Its{' '}
          {team.memberCount} {team.memberCount === 1 ? 'member stays' : 'members stay'} in your workspace — only the team is removed.
        </span>
      ),
      confirmLabel: 'Delete team',
      variant: 'destructive',
    });

    if (confirmed) {
      try {
        await deleteTeamMutation.mutateAsync(team.id);
        toast.success('Team deleted successfully');
        if (selectedTeamId === team.id) {
          closeDetail();
        }
      } catch {
        toast.error('Failed to delete team. Please try again.');
      }
    }
  };

  const hasActiveFilters = Boolean(search || filters.department);

  return (
    <div className="space-y-6">
      <TeamsToolbar
        search={search}
        onSearchChange={setSearch}
        selectedDepartment={filters.department}
        onDepartmentChange={(deptId) => setFilter('department', deptId || '')}
        sortBy={sortBy}
        sortDir={sortDir}
        onSortChange={(field, dir) => setSort(field, dir)}
        hasActiveFilters={hasActiveFilters}
        onClearFilters={clearFilters}
        onCreateTeam={() => setIsCreateOpen(true)}
      />

      <TeamsGrid
        teams={teams}
        isLoading={isLoading}
        hasActiveFilters={hasActiveFilters}
        onClearFilters={clearFilters}
        onCreateTeam={() => setIsCreateOpen(true)}
        onSelectTeam={(team) => openDetail(team.id)}
        onEditTeam={(team) => setEditingTeam(team)}
        onDeleteTeam={handleDeleteTeam}
      />

      {total > 0 && (
        <TablePagination
          page={page}
          pageSize={pageSize}
          total={total}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
          pageSizeOptions={[12, 24, 48]}
        />
      )}

      {/* Create Modal */}
      <TeamFormModal
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
      />

      {/* Edit Modal */}
      {editingTeam && (
        <TeamFormModal
          open={Boolean(editingTeam)}
          onOpenChange={(open) => !open && setEditingTeam(null)}
          team={editingTeam}
        />
      )}

      {/* Detail Sheet */}
      <TeamDetailSheet
        teamId={selectedTeamId}
        onClose={closeDetail}
        onEdit={(team) => setEditingTeam(team)}
        onDelete={handleDeleteTeam}
      />
    </div>
  );
}

