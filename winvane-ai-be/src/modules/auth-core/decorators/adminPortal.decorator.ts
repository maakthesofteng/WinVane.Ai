import { SetMetadata } from '@nestjs/common';
import { AUTH_METADATA_KEYS } from '../constants/auth.constants';

export const AdminPortal = () =>
  SetMetadata(AUTH_METADATA_KEYS.IS_ADMIN_PORTAL, true);
