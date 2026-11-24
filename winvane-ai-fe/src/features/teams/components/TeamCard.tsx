'use client';

import * as React from 'react';
import { useSelector } from 'react-redux';
import { formatDistanceToNow } from 'date-fns';
import { MoreVertical, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { AvatarStack } from '@/components/common/AvatarStack';
import { UserAvatar } from '@/components/common/UserAvatar';
import { selectHasPermission } from '@/store/slices/authSlice';
import type { ITeamCard } from '../types/teams.types';

export interface ITeamCardProps {
  team: ITeamCard;
  onClick: () => void;
  onEdit: (team: ITeamCard) => void;
  onDelete: (team: ITeamCard) => void;
}

export function TeamCard({ team, onClick, onEdit, onDelete }: ITeamCardProps) {
  const canUpdate = useSelector(selectHasPermission('teams:update'));
  const canDelete = useSelector(selectHasPermission('teams:delete'));
  const hasActions = canUpdate || canDelete;

  const previewUsers = React.useMemo(() => {
    return team.membersPreview.map((m) => ({
      name: m.fullName,
      email: m.email,
    }));
  }, [team.membersPreview]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick();
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      className="group relative flex flex-col justify-between rounded-xl border border-border/70 bg-card p-5 text-card-foreground shadow-xs transition-all duration-150 hover:border-primary/40 hover:shadow-md cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
    >
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex items-center gap-2">
              <Tooltip>
                <TooltipTrigger className="max-w-[200px] truncate text-base font-semibold text-foreground text-left group-hover:text-primary transition-colors">
                  {team.name}
                </TooltipTrigger>
                <TooltipContent>{team.name}</TooltipContent>
              </Tooltip>
            </div>
            {team.department ? (
              <Badge variant="secondary" className="max-w-[180px] truncate text-xs font-normal">
                {team.department.name}
              </Badge>
            ) : (
              <span className="text-xs text-muted-foreground">No department</span>
            )}
          </div>

          {hasActions && (
            <div onClick={(e) => e.stopPropagation()}>
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      className="text-muted-foreground hover:text-foreground -mr-1"
                      aria-label="Team actions"
                    />
                  }
                >
                  <MoreVertical className="h-4 w-4" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-36">
                  {canUpdate && (
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        onEdit(team);
                      }}
                      className="gap-2 cursor-pointer"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      Edit team
                    </DropdownMenuItem>
                  )}
                  {canDelete && (
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(team);
                      }}
                      className="gap-2 text-destructive focus:text-destructive cursor-pointer"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Delete team
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </div>

        {/* Description */}
        <p className="text-xs text-muted-foreground line-clamp-2 min-h-[2rem] leading-relaxed">
          {team.description || 'No description provided.'}
        </p>

        {/* Leadership Rows */}
        <div className="space-y-2 rounded-lg bg-muted/40 p-3 text-xs">
          <div className="flex items-center justify-between gap-2">
            <span className="font-medium text-muted-foreground">Team Admin:</span>
            {team.admin ? (
              <div className="flex items-center gap-1.5 min-w-0">
                <UserAvatar name={team.admin.fullName} size="xs" />
                <span className="font-medium text-foreground truncate max-w-[120px]">
                  {team.admin.fullName}
                </span>
                {team.admin.status === 'inactive' && (
                  <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.2 rounded border">
                    Inactive
                  </span>
                )}
              </div>
            ) : (
              <span className="text-muted-foreground italic">Not assigned</span>
            )}
          </div>

          <div className="flex items-center justify-between gap-2">
            <span className="font-medium text-muted-foreground">Team Manager:</span>
            {team.manager ? (
              <div className="flex items-center gap-1.5 min-w-0">
                <UserAvatar name={team.manager.fullName} size="xs" />
                <span className="font-medium text-foreground truncate max-w-[120px]">
                  {team.manager.fullName}
                </span>
                {team.manager.status === 'inactive' && (
                  <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.2 rounded border">
                    Inactive
                  </span>
                )}
              </div>
            ) : (
              <span className="text-muted-foreground italic">Not assigned</span>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-4 mt-4 border-t border-border/50 text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          {previewUsers.length > 0 && (
            <AvatarStack users={previewUsers} max={3} size="xs" />
          )}
          <span>
            <strong className="text-foreground">{team.memberCount}</strong>{' '}
            {team.memberCount === 1 ? 'member' : 'members'}
          </span>
        </div>
        <span className="text-[11px] text-muted-foreground/80">
          Updated {formatDistanceToNow(new Date(team.updatedAt), { addSuffix: true })}
        </span>
      </div>
    </div>
  );
}

