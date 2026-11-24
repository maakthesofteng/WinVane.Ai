export enum WorkspaceVerificationMethod {
  EMAIL_DOMAIN = 'email_domain',
  DNS_TXT = 'dns_txt',
}

export type TWorkspaceVerificationMethod = `${WorkspaceVerificationMethod}`;
