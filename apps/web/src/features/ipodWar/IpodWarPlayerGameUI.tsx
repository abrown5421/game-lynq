import { motion } from 'framer-motion';

const IpodWarPlayerGameUI = () => {

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      className="bg-neutral text-neutral-contrast min-h-screen p-6"
    >
      players play here
    </motion.div>
  );
};

export default IpodWarPlayerGameUI;
