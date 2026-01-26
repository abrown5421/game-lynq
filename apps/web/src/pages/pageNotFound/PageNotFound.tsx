import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const PageNotFound = () => {
  const navigate = useNavigate();

  const glitchVariants = {
    initial: { x: 0, y: 0 },
    glitch: {
      x: [0, -5, 5, -5, 5, 0],
      y: [0, 5, -5, 5, -5, 0],
      transition: {
        duration: 0.5,
        repeat: Infinity,
        repeatDelay: 3
      }
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-neutral sup-min-nav relative z-0 p-4 flex flex-col justify-center items-center overflow-hidden"
    >
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 bg-primary rounded-full opacity-20"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -30, 0],
              opacity: [0.2, 0.5, 0.2],
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          />
        ))}
      </div>

      <div className="absolute top-8 left-8 right-8 flex justify-between items-start z-10">
        <div className="bg-neutral2 border-2 border-primary/30 rounded-lg px-4 py-2">
          <div className="text-primary/70 text-xs font-secondary">SCORE</div>
          <div className="text-primary text-2xl font-mono font-bold">404</div>
        </div>
        
        <div className="bg-neutral2 border-2 border-primary/30 rounded-lg px-4 py-2">
          <div className="text-primary/70 text-xs font-secondary mb-2">LIVES:</div>
          <div className="text-accent text-2xl font-mono flex flex-row">
            {[...Array(3)].map((_, i) => (
              <span key={i}>
                <img 
                  src="/assets/images/404.png" 
                  alt="Page Not Found" 
                  className="w-5 h-auto object-contain m-1" 
                />
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="flex flex-col items-center space-y-8 max-w-2xl">
        <motion.div
          variants={glitchVariants}
          initial="initial"
          animate="glitch"
          className="relative"
        >
          <div className="text-primary text-9xl font-primary my-2 relative z-10">404</div>
          <div className="absolute inset-0 text-accent text-9xl font-primary my-2 opacity-30 blur-sm">404</div>
          <div className="absolute inset-0 text-secondary text-9xl font-primary my-2 opacity-20 blur-md">404</div>
        </motion.div>

        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
          className="bg-neutral2 border-2 border-primary/30 rounded-xl p-8 text-center space-y-4"
        >
          <h1 className="text-4xl font-primary text-primary">GAME OVER</h1>
          <div className="space-y-2">
            <p className="text-xl text-neutral-contrast">Level Not Found</p>
            <p className="text-neutral-contrast/70 font-secondary">
              Looks like you've wandered into uncharted territory!
            </p>
          </div>

          <div className="bg-red-500/40 border-2 border-red-500 rounded-lg p-4 space-y-2">
            <div className="text-red-500 text-sm font-secondary">ERROR CODE</div>
            <div className="text-red-500 font-mono">PAGE_NOT_FOUND_404</div>
          </div>
        </motion.div>

        <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md">
          <motion.button
            onClick={() => navigate(-1)}
            className="btn-secondary flex-1"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Go Back
          </motion.button>

          <motion.button
            onClick={() => navigate('/')}
            className="btn-primary flex-1"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Respawn at Home
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
};

export default PageNotFound;