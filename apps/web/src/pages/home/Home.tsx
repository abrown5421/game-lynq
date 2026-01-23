import { motion } from 'framer-motion';
import { useAppSelector } from '../../app/store/hooks';
import { useNavigate } from 'react-router-dom';
import { useCreateSessionMutation } from '../../app/store/api/sessionsApi';
import Loader from '../../features/loader/Loader';

const Home = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAppSelector((state) => state.auth);
  const [createSession, { isLoading }] = useCreateSessionMutation();

  const handleHostClick = async () => {
    if (!user?._id) return;

    try {
      const session = await createSession({ hostId: user._id }).unwrap();
      navigate(`/host/${session._id}`);
    } catch (err) {
      console.error(err);
      alert('Failed to create session');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-neutral text-neutral-contrast sup-min-nav relative z-0 p-4 w-full h-full flex justify-center items-center"
    >
      {isLoading ? (
        <Loader />
      ) : (
        <div className="flex flex-col w-full sm:w-2/3 lg:w-1/4">
          <div className="text-xl mb-2 font-primary text-primary text-center">
            Welcome!
          </div>
          <div className="text-sm text-center mb-7">
            Choose an option below to get started
          </div>
          <button
            onClick={handleHostClick}
            disabled={!isAuthenticated}
            className={`${isAuthenticated ? 'btn-primary' : 'btn-disabled cursor-not-allowed'} mb-7`}
          >
            Host New Session
          </button>
          <button
            onClick={() => navigate('/join')}
            className="btn-accent"
          >
            Join Existing Session
          </button>
        </div>
      )}
    </motion.div>
  );
};

export default Home;
