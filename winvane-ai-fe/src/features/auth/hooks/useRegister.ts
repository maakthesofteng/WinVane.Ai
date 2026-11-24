'use client';

import { useMutation, type UseMutationResult } from '@tanstack/react-query';
import { registerUser } from '../api/authApi';
import type { IRegisterRequest, IRegisterResponse } from '../types/authApi.types';
import type { ApiError } from '@/lib/api/apiError';

export function useRegister(): UseMutationResult<
  IRegisterResponse,
  ApiError,
  IRegisterRequest
> {
  return useMutation<IRegisterResponse, ApiError, IRegisterRequest>({
    mutationFn: registerUser,
  });
}
