export interface IMemberRole {
  id: string;
  name: string;
  systemKey: 'owner' | 'admin' | 'manager' | 'member' | null;
}

export interface IMemberTeam {
  id: string;
  name: string;
  teamRole: 'admin' | 'manager' | 'member';
}

export interface IMemberInvitation {
  status: 'pending' | 'expired' | 'revoked';
  expiresAt: string;
  lastSentAt: string;
}

export interface IMemberRow {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  jobTitle: string | null;
  role: IMemberRole;
  teams: IMemberTeam[];
  status: 'invited' | 'active' | 'inactive';
  isOwner: boolean;
  isSelf: boolean;
  invitation: IMemberInvitation | null;
  lastLoginAt: string | null;
  createdAt: string;
}

export interface IPaginated<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface IRoleOption {
  id: string;
  name: string;
  systemKey: string | null;
  description: string;
  isCustom: boolean;
}

export interface IRemovedTeamItem {
  id: string;
  name: string;
  teamRole: 'admin' | 'manager' | 'member';
}

export interface IRoleChangeImpact {
  removedFromTeams: IRemovedTeamItem[];
}

export interface IMemberEditResult {
  member: IMemberRow;
  removedFromTeams: IRemovedTeamItem[];
}

export interface IInvitationValidateResponse {
  workspaceName: string;
  fullName: string;
  email: string;
  roleName: string;
  expiresAt: string;
}

export interface IInvitationAcceptResponse {
  message: string;
  redirectTo: string;
}
