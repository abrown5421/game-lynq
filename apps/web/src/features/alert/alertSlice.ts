import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import { AlertProps } from './alertTypes';

const initialState: AlertProps = {
    open: false,
    closeable: true,
    severity: 'success',
    message: '',
    anchor: {y: 'bottom', x: 'right'}
};

const activePageSlice = createSlice({
  name: 'alert',
  initialState,
  reducers: {
    openAlert: (state, action: PayloadAction<AlertProps>) => {
        state.open = action.payload.open,
        state.closeable = action.payload.closeable,
        state.severity = action.payload.severity,
        state.message = action.payload.message,
        state.anchor = action.payload.anchor
    },
    closeAlert: (state) => {
        state.open = false
    },
    resetAlert: () => initialState,
  },
});

export const {
  openAlert,
  closeAlert,
  resetAlert
} = activePageSlice.actions;

export default activePageSlice.reducer;
