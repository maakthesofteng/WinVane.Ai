'use client';

import { useMutation, type UseMutationResult } from '@tanstack/react-query';
import { beginMfaSetup } from '../api/securityApi';
import type {
  IMfaSetupResponse,
  IStepUpPayload,
  TPortal,
} from '../types/securityApi.types';
import type { ApiError } from '@/lib/api/apiError';

export function useMfaSetup(
  portal: TPortal
): UseMutationResult<IMfaSetupResponse, ApiError, IStepUpPayload> {
  return useMutation<IMfaSetupResponse, ApiError, IStepUpPayload>({
    mutationFn: (data: IStepUpPayload) => beginMfaSetup(portal, data),
  });
}

