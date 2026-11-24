import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export interface IUiState {
  sidebarCollapsed: boolean;
  activeModal: string | null;
}

const initialState: IUiState = {
  sidebarCollapsed: false,
  activeModal: null,
};

export const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleSidebar: (state) => {
      state.sidebarCollapsed = !state.sidebarCollapsed;
    },
    setSidebarCollapsed: (state, action: PayloadAction<boolean>) => {
      state.sidebarCollapsed = action.payload;
    },
    openModal: (state, action: PayloadAction<string>) => {
      state.activeModal = action.payload;
    },
    closeModal: (state) => {
      state.activeModal = null;
    },
  },
});

export const { toggleSidebar, setSidebarCollapsed, openModal, closeModal } = uiSlice.actions;

export const selectSidebarCollapsed = (state: { ui: IUiState }) => state.ui.sidebarCollapsed;
export const selectActiveModal = (state: { ui: IUiState }) => state.ui.activeModal;

export default uiSlice.reducer;

