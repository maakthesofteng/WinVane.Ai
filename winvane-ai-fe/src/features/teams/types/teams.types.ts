export interface ITeamPerson {
  userId: string;
  fullName: string;
  email: string;
  jobTitle: string | null;
  status: 'active' | 'inactive';
  roleName: string;
}

export interface ITeamDepartment {
  id: string;
  name: string;
}

export interface ITeamCard {
  id: string;
  name: string;
  description: string | null;
  department: ITeamDepartment | null;
  admin: ITeamPerson | null;
  manager: ITeamPerson | null;
  memberCount: number;
  membersPreview: ITeamPerson[];
  updatedAt: string;
  createdAt: string;
}

export interface ITeamDetail extends ITeamCard {
  members: ITeamPerson[];
  createdBy: { id: string; fullName: string } | null;
}

export interface IMemberOption {
  userId: string;
  fullName: string;
  email: string;
  jobTitle: string | null;
  roleName: string;
  status?: 'active' | 'inactive';
}

export interface IDepartment {
  id: string;
  name: string;
  teamCount: number;
}

export interface ITeamsQueryParams {
  page?: number;
  pageSize?: number;
  search?: string;
  departmentId?: string;
  memberUserId?: string;
  sortBy?: 'name' | 'createdAt' | 'memberCount';
  sortDir?: 'asc' | 'desc';
}

export interface IMemberOptionsQueryParams {
  pool: 'admin' | 'manager' | 'member';
  search?: string;
  limit?: number;
  teamId?: string;
}

export interface ICreateTeamPayload {
  name: string;
  departmentId?: string | null;
  description?: string | null;
  adminUserId?: string | null;
  managerUserId?: string | null;
  memberUserIds?: string[];
}

export interface IUpdateTeamPayload {
  name?: string;
  departmentId?: string | null;
  description?: string | null;
  adminUserId?: string | null;
  managerUserId?: string | null;
  memberUserIds?: string[];
}

