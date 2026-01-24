import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useGetGamesQuery } from '../../app/store/api/gamesApi';
import Loader from '../../features/loader/Loader';

const Games = () => {
  const navigate = useNavigate();
  const { data: games, isLoading, error } = useGetGamesQuery();

  if (isLoading) {
    return (
      <div className="bg-neutral sup-min-nav relative z-0 p-4 flex justify-center items-center min-h-screen">
        <Loader />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-neutral text-neutral-contrast sup-min-nav p-4 flex justify-center items-center min-h-screen">
        Failed to load games.
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-neutral text-neutral-contrast sup-min-nav relative z-0 min-h-screen p-4 flex flex-col items-center"
    >
      <h1 className="text-2xl font-primary text-primary mb-6">
        Choose a Game
      </h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-6xl">
        {games?.map((game: any) => (
          <motion.div
            key={game._id}
            whileHover={{ scale: 1.03 }}
            className="bg-accent text-accent-contrast rounded-lg shadow-md overflow-hidden flex flex-col"
          >
            {game.image ? (
              <img
                src={game.image}
                alt={game.name}
                className="w-full h-40 object-cover"
              />
            ) : (
              <div className="w-full h-40 bg-accent-contrast/20 flex items-center justify-center text-xl">
                🎮
              </div>
            )}

            <div className="p-4 flex flex-col flex-1">
              <h2 className="text-xl font-primary mb-2">
                {game.name}
              </h2>

              <p className="text-sm text-accent-contrast/80 mb-3 flex-1">
                {game.description}
              </p>

              <div className="text-xs text-accent-contrast/70 mb-3 space-y-1">
                <div>Players: {game.minPlayers} – {game.maxPlayers}</div>
                <div>Status: {game.isActive ? 'Active' : 'Inactive'}</div>
              </div>

              <button
                onClick={() => navigate(`/host/game/${game._id}`)}
                disabled={!game.isActive}
                className={`mt-auto ${
                  game.isActive
                    ? 'btn-primary'
                    : 'btn-disabled cursor-not-allowed'
                }`}
              >
                Play
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};

export default Games;
