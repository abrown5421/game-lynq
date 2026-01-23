import React from 'react';
import { useAppDispatch } from '../../../app/store/hooks';
import { closeModal } from '../modalSlice';

interface ConfirmModalProps {
  title?: string;
  message?: string;
  confirmAction?: () => void;
  cancelAction?: () => void;
  confirmText?: string;
  cancelText?: string;
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({
  title = 'Are you sure?',
  message = '',
  confirmAction,
  cancelAction,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
}) => {
  const dispatch = useAppDispatch();

  const handleConfirm = () => {
    if (confirmAction) confirmAction();
    dispatch(closeModal());
  };

  const handleCancel = () => {
    if (cancelAction) cancelAction();
    dispatch(closeModal());
  };

  return (
    <div className="flex flex-col gap-4">
      
      {message && <p className="text-sm text-neutral-contrast">{message}</p>}

      <div className="flex justify-end gap-4 mt-4">
        <button
          onClick={handleCancel}
          className='mt-auto btn-gray'
        >
          {cancelText}
        </button>
        <button
          onClick={handleConfirm}
          className="mt-auto btn-primary"
        >
          {confirmText}
        </button>
      </div>
    </div>
  );
};

export default ConfirmModal;
