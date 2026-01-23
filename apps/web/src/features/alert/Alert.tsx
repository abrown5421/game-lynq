import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppSelector, useAppDispatch } from '../../app/store/hooks';
import { closeAlert, resetAlert } from './alertSlice';

const Alert: React.FC = () => {
  const dispatch = useAppDispatch();
  const alert = useAppSelector((state) => state.alert);

  useEffect(() => {
    if (alert.open) {
      const timer = setTimeout(() => {
        dispatch(closeAlert());
        setTimeout(() => {
            dispatch(resetAlert())
        }, 500)
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [alert.open, dispatch]);

  const anchorStyles = {
    top: alert.anchor.y === 'top' ? 'top-4' : alert.anchor.y === 'center' ? 'top-1/2 -translate-y-1/2' : 'bottom-4',
    left: alert.anchor.x === 'left' ? 'left-4' : alert.anchor.x === 'center' ? 'left-1/2 -translate-x-1/2' : 'right-4',
  };

  const getInitialX = () => {
    switch (alert.anchor.x) {
      case 'left':
        return '-100%';
      case 'center':
        return '0%'; 
      case 'right':
        return '100%';
      default:
        return '0%';
    }
  };

  return (
    <AnimatePresence>
      {alert.open && (
        <motion.div
          initial={{ x: getInitialX(), opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: getInitialX(), opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className={`fixed ${anchorStyles.top} ${anchorStyles.left} z-20 px-6 py-4 rounded shadow-lg border-2
                      ${alert.severity === 'success' ? 'bg-green-200 border-green-600 text-green-600' :
                        alert.severity === 'warning' ? 'bg-yellow-300 border-yellow-600 text-yellow-600' :
                        alert.severity === 'error' ? 'bg-red-300 border-red-600 text-red-600' : 'bg-blue-300 border-blue-600 text-blue-600'}
                      flex items-center space-x-4`}
        >
          <span>{alert.message}</span>
          {alert.closeable && (
            <button
              onClick={() => dispatch(closeAlert())}
              className="ml-4 font-bold"
            >
              ✕
            </button>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default Alert;
