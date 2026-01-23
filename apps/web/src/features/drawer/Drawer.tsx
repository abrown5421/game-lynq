import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppSelector, useAppDispatch } from '../../app/store/hooks';
import { closeDrawer } from './drawerSlice';
import { AnchorPoint } from './drawerTypes';
import { XMarkIcon } from '@heroicons/react/24/solid';
import DrawerNavbar from '../navbar/NavbarDrawer';

const drawerVariants = (anchor: AnchorPoint) => {
    switch (anchor) {
        case 'top':
        return {
            hidden: { y: '-100%' },
            visible: { y: 0 },
            exit: { y: '-100%' },
        };
        case 'bottom':
        return {
            hidden: { y: '100%' },
            visible: { y: 0 },
            exit: { y: '100%' },
        };
        case 'left':
        return {
            hidden: { x: '-100%' },
            visible: { x: 0 },
            exit: { x: '-100%' },
        };
        case 'right':
        default:
        return {
            hidden: { x: '100%' },
            visible: { x: 0 },
            exit: { x: '100%' },
        };
    }
};

const Drawer: React.FC = () => {
  const dispatch = useAppDispatch();
  const drawer = useAppSelector((state) => state.drawer);

  const getClasses = () => {
    switch (drawer.anchor) {
      case 'top':
        return 'top-0 left-0 right-0 h-100';
      case 'bottom':
        return 'bottom-0 left-0 right-0 h-100'; 
      case 'right':
        return 'top-0 bottom-0 right-0 w-100';
      case 'left':
        return 'left-0 bottom-0 right-0 w-100';
      default: 
        return 'top-0 bottom-0 right-0 w-100';
    }
  };

  const getDrawerContent = () => {
    switch (drawer.drawerContent) {
      case 'navbar':
        return <DrawerNavbar />;
      default: 
        return <div>Content not found</div>;
    }
  }

  return (
    <AnimatePresence>
      {drawer.open && (
        <>
          <motion.div
            key="overlay"
            className="fixed inset-0 bg-gray-950/70 z-30"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={() => dispatch(closeDrawer())}
          />

          <motion.div
            key="drawer"
            className={`flex flex-col fixed z-40 bg-neutral p-4 ${getClasses()}`}
            variants={drawerVariants(drawer.anchor)}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={{
              type: 'spring',
              stiffness: 320,
              damping: 32,
            }}
          >
            <div className="flex flex-row items-center justify-between">
                <div className="flex flex-col text-xl font-primary text-neutral-contrast">{drawer.title}</div>
                <div onClick={() => dispatch(closeDrawer())} className="flex flex-col cursor-pointer">
                    <XMarkIcon className="w-7 h-7 text-neutral-contrast" />
                </div>
            </div>
            <div className="my-4 h-px w-full bg-neutral-contrast/25" />
            {getDrawerContent()}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default Drawer;
