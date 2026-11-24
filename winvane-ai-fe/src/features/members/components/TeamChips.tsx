'use client';

import * as React from 'react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import type { IMemberTeam } from '../types/members.types';

export interface ITeamChipsProps {
  teams: IMemberTeam[];
}

export function TeamChips({ teams }: ITeamChipsProps) {
  if (!teams || teams.length === 0) {
    return <span className="text-muted-foreground">—</span>;
  }

  const displayed = teams.slice(0, 2);
  const remainingCount = teams.length - displayed.length;

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {displayed.map((t) => (
        <Link
          key={t.id}
          href={`/teams?tab=teams&team=${t.id}`}
          className="inline-block transition-opacity hover:opacity-80"
        >
          <Badge
            variant="secondary"
            className="max-w-[130px] truncate text-xs font-normal cursor-pointer hover:bg-secondary/80"
            title={`${t.name} (${t.teamRole})`}
          >
            {t.name}
          </Badge>
        </Link>
      ))}

      {remainingCount > 0 && (
        <Tooltip>
          <TooltipTrigger>
            <Badge
              variant="outline"
              className="cursor-pointer text-xs font-medium text-muted-foreground hover:text-foreground"
            >
              +{remainingCount}
            </Badge>
          </TooltipTrigger>
          <TooltipContent className="max-w-xs space-y-1">
            <p className="font-semibold text-xs mb-1">All Assigned Teams:</p>
            {teams.map((t) => (
              <div key={t.id} className="text-xs text-muted-foreground">
                <Link
                  href={`/teams?tab=teams&team=${t.id}`}
                  className="font-medium text-foreground hover:underline"
                >
                  {t.name}
                </Link>{' '}
                <span className="capitalize">({t.teamRole})</span>
              </div>
            ))}
          </TooltipContent>
        </Tooltip>
      )}
    </div>
  );
}
