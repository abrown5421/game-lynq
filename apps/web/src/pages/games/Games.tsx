import { motion } from 'framer-motion';
import { UserIcon } from '@heroicons/react/24/solid';
import { useNavigate } from 'react-router-dom';
import { useGetGamesQuery } from '../../app/store/api/gamesApi';
import Loader from '../../features/loader/Loader';
import Pagination from '../../features/pagination/Pagination';
import { useState, useMemo } from 'react';

const GAMES_PER_PAGE = 10;

const Games = () => {
  const navigate = useNavigate();
  const { data: games, isLoading, error } = useGetGamesQuery();
  const [currentPage, setCurrentPage] = useState(1);

  // Paginate games
  const totalPages = useMemo(() => {
    if (!games) return 0;
    return Math.ceil(games.length / GAMES_PER_PAGE);
  }, [games]);

  const paginatedGames = useMemo(() => {
    if (!games) return [];
    const start = (currentPage - 1) * GAMES_PER_PAGE;
    return games.slice(start, start + GAMES_PER_PAGE);
  }, [games, currentPage]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (isLoading) {
    return (
      <div className="bg-neutral sup-min-nav relative z-0 p-4 flex justify-center items-center min-h-screen">
        <Loader />
      </div>
    );
  }

  if (error || !games) {
    return (
      <div className="bg-neutral sup-min-nav relative z-0 flex flex-col justify-center items-center p-8 min-h-screen">
        <h2 className="text-2xl font-semibold mb-2 text-red-500 font-primary">
          Games Not Found
        </h2>
        <p className="text-neutral-500">
          Sorry, we couldn't load the games.
        </p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-neutral sup-min-nav relative z-0 p-4 flex flex-col items-center min-h-screen"
    >
      <div className="max-w-6xl w-full">
        <h1 className="text-2xl font-primary font-bold mb-6">
          Choose a Game
        </h1>

        {paginatedGames.length === 0 ? (
          <div className="text-center py-12 text-neutral-500 font-semibold text-lg">
            No games available
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {paginatedGames.map((game: any) => (
              <motion.div
                key={game._id}
                whileHover={{ scale: 1.03 }}
                className="bg-accent text-accent-contrast rounded-lg shadow-md overflow-hidden flex flex-col cursor-pointer transition-transform transform"
                onClick={() => navigate(`/host/game/${game._id}`)}
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

                <div className="flex flex-col flex-1 p-4">
                  <h2 className="text-xl font-primary mb-2">{game.name}</h2>
                  <p className="text-sm text-accent-contrast/80 mb-3 flex-1 line-clamp-4">
                    {game.description}
                  </p>

                  <div className="text-xs text-accent-contrast/70 mb-3 flex flex-row items-center space-x-2">
                    <UserIcon className="w-5 h-5" />
                    <span>
                      {game.minPlayers} – {game.maxPlayers}
                    </span>
                  </div>

                  <button
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
        )}

        {totalPages > 1 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        )}
      </div>
    </motion.div>
  );
};

export default Games;
