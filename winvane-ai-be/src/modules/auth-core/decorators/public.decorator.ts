import { SetMetadata } from '@nestjs/common';
import { AUTH_METADATA_KEYS } from '../constants/auth.constants';

export const Public = () => SetMetadata(AUTH_METADATA_KEYS.IS_PUBLIC, true);
