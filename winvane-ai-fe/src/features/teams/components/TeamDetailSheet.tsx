'use client';

import * as React from 'react';
import { useSelector } from 'react-redux';
import { format } from 'date-fns';
import { Pencil, Trash2 } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { selectHasPermission } from '@/store/slices/authSlice';
import { useTeamDetail } from '../hooks/useTeamDetail';
import { TeamPeopleList } from './TeamPeopleList';
import type { ITeamDetail } from '../types/teams.types';

export interface ITeamDetailSheetProps {
  teamId: string | null;
  onClose: () => void;
  onEdit: (team: ITeamDetail) => void;
  onDelete: (team: ITeamDetail) => void;
}

export function TeamDetailSheet({
  teamId,
  onClose,
  onEdit,
  onDelete,
}: ITeamDetailSheetProps) {
  const isOpen = Boolean(teamId);
  const { data: team, isLoading, error } = useTeamDetail(teamId);

  const canUpdate = useSelector(selectHasPermission('teams:update'));
  const canDelete = useSelector(selectHasPermission('teams:delete'));

  const adminList = team?.admin ? [team.admin] : [];
  const managerList = team?.manager ? [team.manager] : [];
  const membersList = team?.members || [];

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-lg flex flex-col p-0 h-full overflow-hidden"
      >
        <SheetHeader className="p-6 pb-4 border-b border-border/60">
          <div className="flex items-start justify-between gap-4 pr-6">
            <div className="space-y-1.5 min-w-0 flex-1">
              {isLoading ? (
                <>
                  <Skeleton className="h-6 w-48" />
                  <Skeleton className="h-4 w-24" />
                </>
              ) : team ? (
                <>
                  <SheetTitle className="text-xl font-bold truncate">
                    {team.name}
                  </SheetTitle>
                  <div className="flex items-center gap-2 flex-wrap">
                    {team.department ? (
                      <Badge variant="secondary" className="text-xs">
                        {team.department.name}
                      </Badge>
                    ) : (
                      <span className="text-xs text-muted-foreground">
                        No department
                      </span>
                    )}
                    <span className="text-xs text-muted-foreground">•</span>
                    <span className="text-xs text-muted-foreground">
                      Created{' '}
                      {format(new Date(team.createdAt), 'MMM d, yyyy')}
                      {team.createdBy && ` by ${team.createdBy.fullName}`}
                    </span>
                  </div>
                </>
              ) : null}
            </div>

            {team && (canUpdate || canDelete) && (
              <div className="flex items-center gap-1.5 shrink-0">
                {canUpdate && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onEdit(team)}
                    className="gap-1.5 text-xs h-8"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    Edit
                  </Button>
                )}
                {canDelete && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDelete(team)}
                    className="text-xs h-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            )}
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {isLoading && (
            <div className="space-y-6">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
          )}

          {!isLoading && error && (
            <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-4 text-center text-sm text-destructive">
              Failed to load team details. Please try again.
            </div>
          )}

          {!isLoading && team && (
            <>
              {/* Description */}
              {team.description && (
                <div className="space-y-1.5">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Description
                  </h4>
                  <p className="text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed">
                    {team.description}
                  </p>
                </div>
              )}

              {/* Team Admin */}
              <TeamPeopleList
                title="Team Admin"
                people={adminList}
                emptyMessage="No Team Admin assigned."
              />

              {/* Team Manager */}
              <TeamPeopleList
                title="Team Manager"
                people={managerList}
                emptyMessage="No Team Manager assigned."
              />

              {/* Team Members */}
              <TeamPeopleList
                title="Team Members"
                people={membersList}
                emptyMessage="No team members assigned."
              />
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
