'use client';

import * as React from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { UserAvatar } from '@/components/common/UserAvatar';
import { StatusBadge } from '@/components/common/StatusBadge';
import { TeamChips } from './TeamChips';
import { MemberRowActions } from './MemberRowActions';
import type { IMemberRow } from '../types/members.types';

function getInvitationSubtitle(member: IMemberRow): string | null {
  if (member.status !== 'invited' || !member.invitation) {
    return null;
  }
  const { status, expiresAt } = member.invitation;
  if (status === 'expired') return 'Invite expired';
  if (status === 'revoked') return 'Invite revoked';

  const diffMs = new Date(expiresAt).getTime() - Date.now();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays <= 0) return 'Expires today';
  return `Expires in ${diffDays} day${diffDays === 1 ? '' : 's'}`;
}

export function createMembersColumns(
  onEdit: (member: IMemberRow) => void
): ColumnDef<IMemberRow>[] {
  return [
    {
      id: 'fullName',
      accessorKey: 'fullName',
      header: 'Name',
      enableSorting: true,
      cell: ({ row }) => {
        const member = row.original;
        return (
          <div className="flex items-center gap-3 min-w-[200px]">
            <UserAvatar name={member.fullName} email={member.email} size="sm" />
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="font-medium text-foreground text-sm">
                  {member.fullName}
                </span>
                {member.isSelf && (
                  <Badge variant="secondary" className="px-1.5 py-0 text-[10px] font-semibold">
                    You
                  </Badge>
                )}
                {member.isOwner && (
                  <Badge
                    variant="outline"
                    className="border-primary/40 bg-primary/10 text-primary px-1.5 py-0 text-[10px] font-semibold"
                  >
                    Owner
                  </Badge>
                )}
              </div>
              {member.jobTitle && (
                <span className="text-xs text-muted-foreground truncate max-w-[180px]">
                  {member.jobTitle}
                </span>
              )}
            </div>
          </div>
        );
      },
    },
    {
      id: 'email',
      accessorKey: 'email',
      header: 'Email',
      enableSorting: true,
      cell: ({ row }) => {
        const email = row.original.email;
        return (
          <Tooltip>
            <TooltipTrigger>
              <span className="cursor-default truncate max-w-[220px] text-sm text-muted-foreground hover:text-foreground">
                {email}
              </span>
            </TooltipTrigger>
            <TooltipContent>{email}</TooltipContent>
          </Tooltip>
        );
      },
    },
    {
      id: 'role',
      accessorKey: 'role.name',
      header: 'Role',
      enableSorting: true,
      cell: ({ row }) => {
        const { role } = row.original;
        const isCustom = !role.systemKey;
        return (
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-medium">{role.name}</span>
            {isCustom && (
              <Badge variant="outline" className="text-[10px] px-1 py-0 text-muted-foreground font-normal">
                Custom
              </Badge>
            )}
          </div>
        );
      },
    },
    {
      id: 'teams',
      header: 'Team(s)',
      enableSorting: false,
      cell: ({ row }) => <TeamChips teams={row.original.teams} />,
    },
    {
      id: 'status',
      accessorKey: 'status',
      header: 'Status',
      enableSorting: true,
      cell: ({ row }) => {
        const member = row.original;
        const sub = getInvitationSubtitle(member);
        return (
          <div className="flex flex-col gap-0.5">
            <StatusBadge status={member.status} />
            {sub && <span className="text-[11px] text-muted-foreground">{sub}</span>}
          </div>
        );
      },
    },
    {
      id: 'actions',
      header: '',
      enableSorting: false,
      cell: ({ row }) => (
        <div className="flex justify-end">
          <MemberRowActions member={row.original} onEdit={onEdit} />
        </div>
      ),
    },
  ];
}

