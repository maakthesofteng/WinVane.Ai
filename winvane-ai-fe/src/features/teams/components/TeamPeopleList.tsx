'use client';

import * as React from 'react';
import { UserAvatar } from '@/components/common/UserAvatar';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Badge } from '@/components/ui/badge';
import type { ITeamPerson } from '../types/teams.types';

export interface ITeamPeopleListProps {
  title: string;
  people: ITeamPerson[];
  emptyMessage?: string;
}

export function TeamPeopleList({
  title,
  people,
  emptyMessage = 'No one assigned',
}: ITeamPeopleListProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {title} ({people.length})
        </h4>
      </div>

      {people.length === 0 ? (
        <p className="text-xs italic text-muted-foreground">{emptyMessage}</p>
      ) : (
        <div className="space-y-2">
          {people.map((person) => (
            <div
              key={person.userId}
              className="flex items-center justify-between gap-3 rounded-lg border border-border/50 bg-background/50 p-2.5 transition-colors hover:bg-muted/40"
            >
              <div className="flex items-center gap-3 min-w-0">
                <UserAvatar name={person.fullName} size="sm" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-sm font-medium text-foreground truncate">
                      {person.fullName}
                    </span>
                    <Badge variant="outline" className="text-[10px] font-normal px-1.5 py-0 text-muted-foreground">
                      {person.roleName}
                    </Badge>
                    {person.status === 'inactive' && (
                      <StatusBadge status="inactive" />
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground truncate">
                    <span>{person.email}</span>
                    {person.jobTitle && (
                      <>
                        <span>•</span>
                        <span className="truncate">{person.jobTitle}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

