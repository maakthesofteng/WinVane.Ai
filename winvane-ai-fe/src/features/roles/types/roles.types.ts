export type TRoleSystemKey = 'admin' | 'manager' | 'member' | null;
export type TTeamSlot = 'admin' | 'manager' | 'member';

export interface IRoleSummary {
  id: string;
  name: string;
  description: string | null;
  systemKey: TRoleSystemKey;
  isSystem: boolean;
  userCount: number;
  permissionKeys: string[];
  canEdit: boolean;
  canDelete: boolean;
  teamSlot: TTeamSlot;
  updatedAt: string;
}

export interface IPermissionItem {
  key: string;
  label: string;
  description: string;
}

export interface IPermissionGroup {
  module: string;
  moduleLabel: string;
  permissions: IPermissionItem[];
}

export interface IPermissionCatalogResponse {
  groups: IPermissionGroup[];
  grantableKeys: string[];
}

export interface ICreateRolePayload {
  name: string;
  description?: string;
  copyFromRoleId?: string;
}

export interface ICreateRoleResult extends IRoleSummary {
  droppedKeys?: string[];
}

export interface IUpdateRolePayload {
  name?: string;
  description?: string;
}

export interface IUpdateRolePermissionsPayload {
  permissionKeys: string[];
}

