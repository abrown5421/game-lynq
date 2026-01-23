import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const PageNotFound = () => {
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-neutral sup-min-nav relative z-0 p-4 flex  flex-8 flex-col justify-center items-center"
    >
      <div className='text-primary text-9xl font-primary my-2'>404</div>
      <div className='my-4'>
        <img 
          src="/assets/images/404.png" 
          alt="Page Not Found" 
          className="w-96 h-auto object-contain" 
        />
      </div>
      <div className='text-secondary text-xl my-2'>Not all who wander are lost. But you sure are!</div>

      <button
        onClick={() => navigate('/')}
        className="btn-primary max-w-xs"
      >
        Go Home
      </button>
    </motion.div>
  );
};

export default PageNotFound;
