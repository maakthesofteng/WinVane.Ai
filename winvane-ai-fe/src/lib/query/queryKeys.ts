export const QUERY_KEYS = {
  auth: {
    all: ['auth'] as const,
    me: () => [...QUERY_KEYS.auth.all, 'me'] as const,
  },
  workspace: {
    all: ['workspace'] as const,
    detail: (workspaceId: string) => [...QUERY_KEYS.workspace.all, 'detail', workspaceId] as const,
  },
  companyBrain: {
    all: ['companyBrain'] as const,
    detail: (workspaceId: string) =>
      [...QUERY_KEYS.companyBrain.all, 'detail', workspaceId] as const,
  },
  members: {
    all: ['members'] as const,
    list: (params?: unknown) => [...QUERY_KEYS.members.all, 'list', params] as const,
    detail: (id: string) => [...QUERY_KEYS.members.all, 'detail', id] as const,
    assignableRoles: () => [...QUERY_KEYS.members.all, 'assignableRoles'] as const,
  },
  teams: {
    all: ['teams'] as const,
    list: (params?: unknown) => [...QUERY_KEYS.teams.all, 'list', params] as const,
    detail: (id: string) => [...QUERY_KEYS.teams.all, 'detail', id] as const,
    memberOptions: (pool?: string, search?: string) =>
      [...QUERY_KEYS.teams.all, 'memberOptions', { pool, search }] as const,
  },
  departments: {
    all: ['departments'] as const,
    list: (search?: string) => [...QUERY_KEYS.departments.all, 'list', search] as const,
  },
  roles: {
    all: ['roles'] as const,
    list: () => [...QUERY_KEYS.roles.all, 'list'] as const,
    detail: (id: string) => [...QUERY_KEYS.roles.all, 'detail', id] as const,
  },
  permissions: {
    all: ['permissions'] as const,
    catalog: () => [...QUERY_KEYS.permissions.all, 'catalog'] as const,
  },
  team: {
    all: ['team'] as const,
    members: (workspaceId: string) => [...QUERY_KEYS.team.all, 'members', workspaceId] as const,
    invitations: (workspaceId: string) =>
      [...QUERY_KEYS.team.all, 'invitations', workspaceId] as const,
  },
  sessions: {
    all: ['sessions'] as const,
    list: () => [...QUERY_KEYS.sessions.all, 'list'] as const,
  },
  dashboard: {
    all: ['dashboard'] as const,
    stats: (workspaceId: string) => [...QUERY_KEYS.dashboard.all, 'stats', workspaceId] as const,
  },
  admin: {
    all: ['admin'] as const,
    me: () => [...QUERY_KEYS.admin.all, 'me'] as const,
    stats: () => [...QUERY_KEYS.admin.all, 'stats'] as const,
    tenants: (page = 1, limit = 20) =>
      [...QUERY_KEYS.admin.all, 'tenants', { page, limit }] as const,
  },
  security: {
    all: ['security'] as const,
    mfa: (portal: 'tenant' | 'admin') => [...QUERY_KEYS.security.all, 'mfa', portal] as const,
    sessions: (portal: 'tenant' | 'admin') =>
      [...QUERY_KEYS.security.all, 'sessions', portal] as const,
  },
} as const;
