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

export type TMemberStatus = 'invited' | 'active' | 'inactive';
export type TMembersSortBy = 'fullName' | 'email' | 'role' | 'status' | 'createdAt' | 'lastLoginAt';

export interface IMembersQueryParams {
  page?: number;
  pageSize?: number;
  search?: string;
  roleId?: string;
  status?: TMemberStatus;
  teamId?: string;
  sortBy?: TMembersSortBy;
  sortDir?: 'asc' | 'desc';
}

export interface IInviteMemberPayload {
  fullName: string;
  email: string;
  phone?: string | null;
  jobTitle?: string | null;
  roleId: string;
}

export interface IUpdateMemberPayload {
  fullName?: string;
  phone?: string | null;
  jobTitle?: string | null;
  roleId?: string;
}

export interface IInvitationDetails {
  workspaceName: string;
  fullName: string;
  email: string;
  roleName: string;
  expiresAt: string;
}

export interface IAcceptInvitationPayload {
  token: string;
  password: string;
}

export interface IAcceptInvitationResponse {
  message: string;
  redirectTo: string;
}

