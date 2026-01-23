export interface ModalState {
  open: boolean;
  modalContent: string;
  title?: string;
  message?: string;
  confirmAction?: () => void | Promise<void>;
  cancelAction?: () => void;
  confirmText?: string;
  cancelText?: string;
}

export type OpenModalPayload = Omit<ModalState, 'open'>;