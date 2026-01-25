import { motion } from "framer-motion";
import { useParams } from "react-router-dom";
import { useGetSessionByIdQuery } from "../../app/store/api/sessionsApi";
import Loader from "../../features/loader/Loader";
import { gameSettingsRegistry } from "../games/gameSettingsRegistry";

const Settings = () => {
  const { id } = useParams<{ id: string }>();

  const { data: session, isLoading } = useGetSessionByIdQuery(id!, {
    pollingInterval: 2000,
  });

  if (isLoading || !session) {
    return (
      <div className="w-screen h-screen flex items-center justify-center">
        <Loader />
      </div>
    );
  }

  const gameId = session.selectedGameId;

  if (!gameId) {
    return (
      <div className="text-center text-xl text-yellow-500">
        No game selected yet.
      </div>
    );
  }

  const GameSettingsComponent = gameSettingsRegistry[gameId];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-neutral sup-min-nav relative z-0 p-4 min-h-screen"
    >
      {!GameSettingsComponent ? (
        <div className="text-center text-xl text-red-500">
          No settings registered for this game.
        </div>
      ) : (
        <GameSettingsComponent session={session} />
      )}
    </motion.div>
  );
};

export default Settings;
