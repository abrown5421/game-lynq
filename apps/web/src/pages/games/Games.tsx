import { motion } from 'framer-motion';
import { UserIcon } from '@heroicons/react/24/solid';
import { useNavigate, useParams } from 'react-router-dom';
import { useGetGamesQuery } from '../../app/store/api/gamesApi';
import { useSelectGameMutation } from '../../app/store/api/sessionsApi';
import { openAlert } from '../../features/alert/alertSlice';
import { useAppDispatch } from '../../app/store/hooks';
import Loader from '../../features/loader/Loader';
import Pagination from '../../features/pagination/Pagination';
import { useState, useMemo } from 'react';

const GAMES_PER_PAGE = 10;

const Games = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { id } = useParams<{ id: string }>();

  const { data: games, isLoading, error } = useGetGamesQuery();
  const [selectGame] = useSelectGameMutation();

  const [currentPage, setCurrentPage] = useState(1);

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
      <div className="min-h-screen flex items-center justify-center bg-neutral">
        <Loader />
      </div>
    );
  }

  if (error || !games) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral">
        <div className="bg-neutral2 rounded-xl border-2 border-red-500/30 p-8 text-center">
          <h2 className="text-2xl font-primary font-bold text-red-400 mb-2">
            Games Not Found
          </h2>
          <p className="text-neutral-contrast/70">
            Sorry, we couldn't load the games.
          </p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      className="bg-neutral text-neutral-contrast min-h-screen p-6"
    >
      <div className="max-w-6xl mx-auto space-y-6">

        <div className="bg-neutral2 rounded-xl border-2 border-neutral-contrast/10 p-6">
          <h1 className="text-3xl font-primary font-bold text-primary mb-2">
            Choose a Game
          </h1>
          <p className="text-neutral-contrast/70">
            Select a game to start your session.
          </p>
        </div>

        {paginatedGames.length === 0 ? (
          <div className="bg-neutral2 rounded-xl border-2 border-neutral-contrast/10 p-12 text-center">
            <p className="text-neutral-contrast/50 text-lg">No games available</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {paginatedGames.map((game: any) => (
              <motion.div
                key={game._id}
                whileHover={{ scale: 1.03 }}
                className="bg-neutral2 rounded-xl border-2 border-neutral-contrast/10 overflow-hidden flex flex-col cursor-pointer transition-all hover:border-primary/40"
                onClick={async () => {
                  if (!id) return;

                  try {
                    await selectGame({
                      sessionId: id,
                      gameId: game._id,
                    }).unwrap();

                    navigate(`/host/${id}/settings`);
                  } catch (err: any) {
                    dispatch(
                      openAlert({
                        open: true,
                        closeable: true,
                        severity: "error",
                        message: `Failed to select game: ${err?.data?.error}`,
                        anchor: { x: "right", y: "bottom" },
                      })
                    );
                  }
                }}
              >
                {game.image ? (
                  <img
                    src={game.image}
                    alt={game.name}
                    className="w-full h-40 object-cover"
                  />
                ) : (
                  <div className="w-full h-40 bg-neutral3 flex items-center justify-center text-4xl">
                    🎮
                  </div>
                )}

                <div className="flex flex-col flex-1 p-4 space-y-3">
                  <h2 className="text-xl font-primary font-bold text-primary">
                    {game.name}
                  </h2>

                  <p className="text-sm text-neutral-contrast/70 line-clamp-4 flex-1">
                    {game.description}
                  </p>

                  <div className="flex items-center space-x-2 text-neutral-contrast/60">
                    <UserIcon className="w-5 h-5" />
                    <span>
                      {game.minPlayers} – {game.maxPlayers} players
                    </span>
                  </div>

                  <button
                    disabled={!game.isActive}
                    className={`mt-2 ${
                      game.isActive ? 'btn-primary' : 'btn-disabled'
                    }`}
                  >
                    {game.isActive ? 'Play' : 'Coming Soon'}
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
        
        {totalPages > 1 && (
          <div className="bg-neutral2 rounded-xl border-2 border-neutral-contrast/10 p-4">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
            />
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default Games;
