export enum WorkspaceStatus {
  PENDING_VERIFICATION = 'pending_verification',
  ACTIVE = 'active',
  SUSPENDED = 'suspended',
}

export type TWorkspaceStatus = `${WorkspaceStatus}`;
