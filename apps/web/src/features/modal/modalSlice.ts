import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { ModalState, OpenModalPayload } from './modalTypes';

const initialState: ModalState = {
  open: false,
  modalContent: '',
  title: '',
  message: '',
  confirmAction: undefined,
  cancelAction: undefined,
  confirmText: 'Confirm',
  cancelText: 'Cancel',
};

const modalSlice = createSlice({
  name: 'modal',
  initialState,
  reducers: {
    openModal: (state, action: PayloadAction<OpenModalPayload>) => {
      state.open = true;
      Object.assign(state, action.payload);
    },
    closeModal: (state) => {
      state.open = false;
    },
    resetModal: () => initialState,
  },
});

export const { openModal, closeModal, resetModal } = modalSlice.actions;
export default modalSlice.reducer;
