import { createSelector, createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { IAuthState, IAuthUser, IWorkspaceSummary } from '@/types/auth.types';

export interface ISessionResolvedPayload {
  portal: 'tenant' | 'admin';
  user: IAuthUser;
  workspace: IWorkspaceSummary | null;
}

export interface IMfaChallengePayload {
  portal?: 'tenant' | 'admin';
}

const initialState: IAuthState = {
  status: 'unknown',
  portal: null,
  user: null,
  workspace: null,
};

export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    sessionResolved: (state, action: PayloadAction<ISessionResolvedPayload>) => {
      state.status = 'authenticated';
      state.portal = action.payload.portal;
      state.user = action.payload.user;
      state.workspace = action.payload.workspace;
    },
    mfaChallengeStarted: (state, action: PayloadAction<IMfaChallengePayload | undefined>) => {
      state.status = 'mfa_required';
      state.portal = action.payload?.portal ?? 'tenant';
      state.user = null;
      state.workspace = null;
    },
    sessionCleared: (state) => {
      state.status = 'unauthenticated';
      state.portal = null;
      state.user = null;
      state.workspace = null;
    },
  },
});

export const { sessionResolved, mfaChallengeStarted, sessionCleared } = authSlice.actions;

export const selectAuthStatus = (state: { auth: IAuthState }) => state.auth.status;
export const selectPortal = (state: { auth: IAuthState }) => state.auth.portal;
export const selectCurrentUser = (state: { auth: IAuthState }) => state.auth.user;
export const selectWorkspace = (state: { auth: IAuthState }) => state.auth.workspace;

export const selectIsSuperAdmin = createSelector(
  [selectCurrentUser],
  (user) => user?.role === 'SuperAdmin' || user?.isPlatformRole === true
);

export const selectHasPermission = (permissionKey: string) =>
  createSelector([selectCurrentUser], (user) => {
    if (!user) {
      return false;
    }
    if (user.role === 'SuperAdmin' || user.role === 'Owner' || user.isPlatformRole === true) {
      return true;
    }
    return Boolean(user.permissions?.includes(permissionKey));
  });

export default authSlice.reducer;
