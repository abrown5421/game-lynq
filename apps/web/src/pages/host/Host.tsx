import { motion } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import { useDeleteSessionMutation, useGetSessionByIdQuery, useRemovePlayerMutation, useSelectGameMutation, useStartGameMutation } from '../../app/store/api/sessionsApi';
import Loader from '../../features/loader/Loader';
import { useAppDispatch } from '../../app/store/hooks';
import { QRCodeSVG } from 'qrcode.react';
import { openAlert } from '../../features/alert/alertSlice';
import { useEffect, useState } from 'react';

const Host = () => {
  const dispatch = useAppDispatch();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const joinAudio = new Audio("/assets/audio/join.mp3");
  const { data: session, isLoading, refetch } = useGetSessionByIdQuery(id!, { pollingInterval: 2000 });
  const [removePlayer] = useRemovePlayerMutation();
  const [deleteSession] = useDeleteSessionMutation();
  const [startGame, { isLoading: isStarting }] = useStartGameMutation();
  const [prevPlayerCount, setPrevPlayerCount] = useState(0);

  useEffect(() => {
    if (!session?.players) return;

    if (session.players.length > prevPlayerCount) {
      joinAudio.play().catch((err) => {
        console.warn("Failed to play join sound:", err);
      });
    }

    setPrevPlayerCount(session.players.length);
  }, [session?.players]);

  useEffect(() => {
    if (!session) return;

    switch (session.status) {
      case "selectGame":
        navigate(`/host/${id}/games`);
        break;
      case "settings":
        navigate(`/host/${id}/settings`);
        break;
      case "playing":
        navigate(`/host/${id}/game`);
        break;
      case "ended":
        navigate(`/`);
        break;
      default:
        break;
    }
  }, [session?.status, navigate, id]);

  const handleRemovePlayer = async (playerName: string) => {
    if (!id) return;
    try {
      await removePlayer({ sessionId: id, data: { playerName } }).unwrap();
      refetch();
    } catch (err) {
      console.error("Failed to remove player:", err);
    }
  };

  const handleEndSession = async () => {
    if (!id) return;
    try {
      await deleteSession(id).unwrap();
      navigate("/");
    } catch (err) {
      dispatch(
        openAlert({
          open: true,
          closeable: true,
          severity: "error",
          message: "Failed to end session",
          anchor: { x: "right", y: "bottom" },
        })
      );
    }
  };

  const handleStartGame = async () => {
    if (!id || !session) return;

    try {
      if (session.selectedGameId) {
        await startGame(id).unwrap();
      } else {
        navigate(`/host/${id}/games`);
      }

      refetch();
    } catch (err) {
      dispatch(
        openAlert({
          open: true,
          closeable: true,
          severity: "error",
          message: "Failed to start game",
          anchor: { x: "right", y: "bottom" },
        })
      );
    }
  };

  if (isLoading || !session) {
    return (
      <div className="w-screen h-screen bg-neutral flex items-center justify-center">
        <Loader />
      </div>
    );
  }

  const players = session.players || [];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-neutral text-neutral-contrast min-h-screen p-6"
    >
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        <div className="bg-neutral2 rounded-xl border-2 border-neutral-contrast/10 p-8 flex flex-col items-center space-y-6">
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-primary font-bold text-primary">Your Session Code</h2>
            <p className="text-neutral-contrast/70">Share this code with players to join</p>
          </div>
          
          <div className="bg-accent/20 rounded-lg px-8 py-4 border-2 border-accent/30">
            <div className="text-6xl font-mono font-bold tracking-widest text-primary">
              {session.code}
            </div>
          </div>

          <div className="bg-neutral3 rounded-lg p-6 border-2 border-neutral-contrast/10">
            <QRCodeSVG
              value={`${window.location.origin}/join/${session.code}`}
              size={200}
              bgColor="transparent"
              fgColor="#FFFDF6"
            />
          </div>

          <p className="text-sm text-neutral-contrast/60 text-center max-w-sm">
            Players can scan this QR code or visit{' '}
            <span className="font-mono bg-neutral3/50 px-2 py-1 rounded text-primary">
              /join/{session.code}
            </span>
          </p>

          <div className="w-full grid grid-cols-2 gap-4 pt-4">
            <button
              onClick={handleEndSession}
              className="btn-error"
            >
              End Session
            </button>
            <button
              onClick={handleStartGame}
              disabled={players.length === 0 || isStarting}
              className={`${players.length === 0 || isStarting ? 'btn-disabled' : 'btn-primary'}`}
            >
              {isStarting ? <Loader /> : 'Pick Game'}
            </button>
          </div>
        </div>

        <div className="bg-neutral2 rounded-xl border-2 border-neutral-contrast/10 p-8 flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-primary font-bold text-primary">
              Players
            </h3>
            <div className="bg-accent/20 rounded-lg px-4 py-2 border-2 border-accent/30">
              <span className="text-2xl font-bold text-primary">{players.length}</span>
            </div>
          </div>

          {players.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center space-y-4 py-12">
              <div className="text-6xl opacity-30">👥</div>
              <p className="text-neutral-contrast/50 text-lg">Waiting for players to join...</p>
            </div>
          ) : (
            <div className="space-y-3 flex-1 overflow-y-auto">
              {players.map((player: any, idx: number) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="bg-neutral3 rounded-lg p-4 border-2 border-neutral-contrast/10 flex items-center justify-between hover:border-primary/30 transition-all group"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center border-2 border-primary/30">
                      <span className="text-primary font-bold">{idx + 1}</span>
                    </div>
                    <span className="text-lg font-medium">{player.name}</span>
                  </div>
                  <button
                    onClick={() => handleRemovePlayer(player.name)}
                    className="px-4 py-2 bg-red-500/20 text-red-400 rounded-lg border-2 border-red-500/30 hover:bg-red-500 hover:text-white transition-all text-sm font-medium"
                  >
                    Remove
                  </button>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default Host;