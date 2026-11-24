'use client';

import * as React from 'react';
import { useSelector } from 'react-redux';
import { Users, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/common/EmptyState';
import { selectHasPermission } from '@/store/slices/authSlice';
import { TeamCard } from './TeamCard';
import type { ITeamCard } from '../types/teams.types';

export interface ITeamsGridProps {
  teams: ITeamCard[];
  isLoading: boolean;
  hasActiveFilters: boolean;
  onClearFilters: () => void;
  onCreateTeam: () => void;
  onSelectTeam: (team: ITeamCard) => void;
  onEditTeam: (team: ITeamCard) => void;
  onDeleteTeam: (team: ITeamCard) => void;
}

export function TeamsGrid({
  teams,
  isLoading,
  hasActiveFilters,
  onClearFilters,
  onCreateTeam,
  onSelectTeam,
  onEditTeam,
  onDeleteTeam,
}: ITeamsGridProps) {
  const canCreate = useSelector(selectHasPermission('teams:create'));

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, idx) => (
          <div
            key={idx}
            className="flex flex-col justify-between rounded-xl border border-border/70 bg-card p-5 space-y-4"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-4 w-16" />
              </div>
              <Skeleton className="h-8 w-full" />
              <div className="rounded-lg bg-muted/40 p-3 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            </div>
            <div className="flex items-center justify-between pt-4 border-t border-border/50">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-3 w-16" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (teams.length === 0) {
    if (hasActiveFilters) {
      return (
        <EmptyState
          icon={<Users className="h-10 w-10 text-muted-foreground" aria-hidden="true" />}
          title="No teams match your filters"
          description="Try adjusting or clearing your search query or department filter."
          action={
            <Button variant="outline" size="sm" onClick={onClearFilters}>
              Clear filters
            </Button>
          }
        />
      );
    }

    return (
      <EmptyState
        icon={<Users className="h-10 w-10 text-muted-foreground" aria-hidden="true" />}
        title="Create your first team"
        description="Group your people into functional delivery teams with dedicated Admins and Managers."
        action={
          canCreate ? (
            <Button size="sm" onClick={onCreateTeam} className="gap-1.5">
              <Plus className="h-4 w-4" />
              Create team
            </Button>
          ) : undefined
        }
      />
    );
  }

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
      {teams.map((team) => (
        <TeamCard
          key={team.id}
          team={team}
          onClick={() => onSelectTeam(team)}
          onEdit={onEditTeam}
          onDelete={onDeleteTeam}
        />
      ))}
    </div>
  );
}

