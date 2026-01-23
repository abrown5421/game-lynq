import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppSelector, useAppDispatch } from '../../app/store/hooks';
import { closeModal } from './modalSlice';
import { XMarkIcon } from '@heroicons/react/24/solid';
import ConfirmModal from './general/ConfirmModal';

const Modal: React.FC = () => {
  const dispatch = useAppDispatch();
  const modal = useAppSelector((state) => state.modal);

  const getModalContent = () => {
    switch (modal.modalContent) {
      case 'confirm':
        return (
          <ConfirmModal
            title={modal.title}
            message={modal.message}
            confirmAction={modal.confirmAction}
            cancelAction={modal.cancelAction}
            confirmText={modal.confirmText}
            cancelText={modal.cancelText}
          />
        );
      default:
        return <div>Content not found</div>;
    }
  };

  return (
    <AnimatePresence>
      {modal.open && (
        <>
          <motion.div
            key="overlay"
            className="fixed inset-0 bg-gray-950/70 z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={() => dispatch(closeModal())}
          />

          <motion.div
            key="modal"
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ y: '100%', opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: '100%', opacity: 0 }}
              transition={{ type: 'tween', duration: 0.3 }}
              className="bg-neutral w-full md:w-1/2 lg:w-1/3 p-6 rounded-xl shadow-md relative"
            >
              <div className="flex flex-row items-center justify-between mb-4">
                <h2 className="text-xl font-primary">{modal.title}</h2>
                <button
                  onClick={() => dispatch(closeModal())}
                  className="flex items-center justify-center"
                >
                  <XMarkIcon className="w-6 h-6 text-neutral-contrast cursor-pointer" />
                </button>
              </div>

              <div className="my-4 h-px w-full bg-neutral-contrast/10" />

              {getModalContent()}
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default Modal;
