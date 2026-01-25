import { motion } from 'framer-motion';
import { useParams } from 'react-router-dom';
import { useGetSessionByIdQuery } from '../../app/store/api/sessionsApi';
import Loader from '../../features/loader/Loader';
import { playerGameUIRegistry } from '../games/playerGameUIRegistry';

const PlayerGame = () => {
  const { id, playerId } = useParams<{ id: string; playerId: string }>();

  const { data: session, isLoading } = useGetSessionByIdQuery(id!, {
    pollingInterval: 1000,
  });

  if (isLoading || !session) {
    return (
      <div className="w-screen h-screen flex items-center justify-center bg-neutral">
        <Loader />
      </div>
    );
  }

  const gameId = session.selectedGameId;

  if (!gameId) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="w-screen h-screen flex items-center justify-center bg-neutral"
      >
        <div className="text-center text-xl text-yellow-500">
          No game selected yet.
        </div>
      </motion.div>
    );
  }

  const PlayerGameUIComponent = playerGameUIRegistry[gameId];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-neutral sup-min-nav relative z-0 min-h-screen"
    >
      {!PlayerGameUIComponent ? (
        <div className="text-center text-xl text-red-500 p-8">
          No player UI registered for this game.
        </div>
      ) : (
        <PlayerGameUIComponent session={session} />
      )}
    </motion.div>
  );
};

export default PlayerGame;