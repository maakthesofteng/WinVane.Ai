export interface IRoleSummary {
  id: string;
  name: string;
  description: string | null;
  systemKey: 'admin' | 'manager' | 'member' | null;
  isSystem: boolean;
  userCount: number;
  permissionKeys: string[];
  canEdit: boolean;
  canDelete: boolean;
  teamSlot: 'admin' | 'manager' | 'member';
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

export interface ICreateRoleResult extends IRoleSummary {
  droppedKeys?: string[];
}
