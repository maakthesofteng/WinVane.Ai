'use client';

import * as React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSelector } from 'react-redux';
import { Users, UserCheck } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PageHeader } from '@/components/common/PageHeader';
import { MembersTab } from '@/features/members/components/MembersTab';
import { TeamsTab } from '@/features/teams/components/TeamsTab';
import { selectCurrentUser } from '@/store/slices/authSlice';

export default function TeamsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const user = useSelector(selectCurrentUser);

  const canViewMembers =
    !user ||
    user.role === 'SuperAdmin' ||
    user.isPlatformRole ||
    user.permissions?.includes('members:read');

  const canViewTeams =
    !user ||
    user.role === 'SuperAdmin' ||
    user.isPlatformRole ||
    user.permissions?.includes('teams:read');

  const defaultTab = canViewMembers ? 'members' : canViewTeams ? 'teams' : 'members';
  const rawTab = searchParams.get('tab');
  const activeTab = rawTab === 'teams' && canViewTeams ? 'teams' : rawTab === 'members' && canViewMembers ? 'members' : defaultTab;

  const handleTabChange = (nextTab: string) => {
    router.replace(`/teams?tab=${nextTab}`, { scroll: false });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Teams"
        description="Manage workspace members, team rosters, and department structures."
      />

      <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
        <TabsList className="bg-muted/50 p-1">
          {canViewMembers && (
            <TabsTrigger value="members" className="gap-2 px-4 py-2">
              <UserCheck className="h-4 w-4" />
              Members
            </TabsTrigger>
          )}
          {canViewTeams && (
            <TabsTrigger value="teams" className="gap-2 px-4 py-2">
              <Users className="h-4 w-4" />
              Teams
            </TabsTrigger>
          )}
        </TabsList>

        {canViewMembers && (
          <TabsContent value="members" className="outline-none">
            <MembersTab />
          </TabsContent>
        )}

        {canViewTeams && (
          <TabsContent value="teams" className="outline-none">
            <TeamsTab />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
