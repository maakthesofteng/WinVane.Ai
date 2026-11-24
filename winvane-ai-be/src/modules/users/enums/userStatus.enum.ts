export enum UserStatus {
  PENDING = 'pending',
  INVITED = 'invited',
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
}

export type TUserStatus = `${UserStatus}`;
