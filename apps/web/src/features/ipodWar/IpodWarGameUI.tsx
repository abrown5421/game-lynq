import { motion } from 'framer-motion';

const IpodWarGameUI = () => {

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      className="bg-neutral text-neutral-contrast min-h-screen p-6"
    >
      Game play here
    </motion.div>
  );
};

export default IpodWarGameUI;
