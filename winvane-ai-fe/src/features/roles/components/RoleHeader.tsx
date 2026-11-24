'use client';

import * as React from 'react';
import Link from 'next/link';
import { MoreVertical, Pencil, Trash2, Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils/cn';
import type { IRoleSummary } from '../types/roles.types';

export interface IRoleHeaderProps {
  role: IRoleSummary;
  canManageRoles: boolean;
  onEditDetails: () => void;
  onDelete: () => void;
}

const TEAM_SLOT_LABELS: Record<string, string> = {
  admin: 'Team Admin',
  manager: 'Team Manager',
  member: 'Team Members',
};

export function RoleHeader({
  role,
  canManageRoles,
  onEditDetails,
  onDelete,
}: IRoleHeaderProps) {
  const memberCountText =
    role.userCount === 1 ? 'Used by 1 member' : `Used by ${role.userCount} members`;

  const teamSlotText = TEAM_SLOT_LABELS[role.teamSlot] ?? role.teamSlot;

  return (
    <div className="rounded-xl border border-border/60 bg-card p-4 sm:p-6 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        {/* Left: Role name, badges, description */}
        <div className="space-y-1.5 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-foreground">
              {role.name}
            </h1>
            <Badge
              variant={role.isSystem ? 'secondary' : 'outline'}
              className={cn(
                'text-xs font-normal',
                !role.isSystem && 'border-primary/40 text-primary bg-primary/5'
              )}
            >
              {role.isSystem ? 'System role' : 'Custom role'}
            </Badge>
          </div>

          {role.description && (
            <p className="text-sm text-muted-foreground leading-relaxed">
              {role.description}
            </p>
          )}

          {/* Members link & team slot info */}
          <div className="flex flex-wrap items-center gap-y-1 gap-x-4 pt-1 text-xs text-muted-foreground">
            <Link
              href={`/teams?tab=members&role=${role.id}`}
              className="inline-flex items-center gap-1.5 text-primary hover:underline font-medium"
            >
              <Users className="h-3.5 w-3.5" />
              <span>{memberCountText}</span>
            </Link>

            <span className="text-border hidden sm:inline">•</span>

            <span className="text-muted-foreground/80">
              Team dropdown:{' '}
              <span className="font-medium text-foreground">{teamSlotText}</span>
            </span>
          </div>
        </div>

        {/* Right: Actions menu */}
        {canManageRoles && (
          <div className="flex items-center gap-2 self-start shrink-0">
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button
                    variant="outline"
                    size="icon-sm"
                    aria-label="Role options"
                    className="h-8 w-8 text-muted-foreground hover:text-foreground"
                  >
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                }
              />
              <DropdownMenuContent align="end" className="w-44">
                <DropdownMenuItem onClick={onEditDetails}>
                  <Pencil className="h-4 w-4 mr-2" />
                  Edit details
                </DropdownMenuItem>

                {!role.isSystem && (
                  <>
                    {!role.canDelete ? (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger
                            render={
                              <div>
                                <DropdownMenuItem
                                  disabled
                                  className="cursor-not-allowed opacity-50 text-destructive"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete role
                                </DropdownMenuItem>
                              </div>
                            }
                          />
                          <TooltipContent side="left" className="text-xs max-w-xs">
                            <p>Remove all members from this role first</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    ) : (
                      <DropdownMenuItem
                        variant="destructive"
                        onClick={onDelete}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete role
                      </DropdownMenuItem>
                    )}
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>
    </div>
  );
}
