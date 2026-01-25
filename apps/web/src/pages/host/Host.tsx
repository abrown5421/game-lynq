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
      <div className="w-screen h-screen bg-neutral-contrast flex items-center justify-center">
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
      className="bg-neutral text-neutral-contrast sup-min-nav relative z-0 min-h-screen"
    >
      <div className="flex flex-row w-full sup-min-nav">
        <div className="flex flex-col items-center justify-center flex-1 sup-min-nav p-4">
          <div className="w-full max-w-lg bg-accent text-accent-contrast p-6 shadow-md flex flex-col items-center space-y-3 text-center">
            <h2 className="text-2xl text-accent-contrast font-primary">Your Session Code</h2>
            <div className="text-5xl font-mono bg-accent-contrast/30 pb-1 px-4">{session.code}</div>
            <p className="text-s">
              Use the code above to join the session! Players can go to{' '}
              <span className="font-mono bg-accent-contrast/30 px-2 pb-1">
                /join/{session.code}
              </span>{' '}
              or scan the QR code below.
            </p>

            <div className="mt-4">
              <QRCodeSVG
                value={`${window.location.origin}/join/${session.code}`}
                size={150}
                bgColor="transparent"
                fgColor="#fff"
              />
            </div>
            <div className="w-full gap-3 flex flex-row">
              <button
                onClick={handleEndSession}
                className="btn-error mt-4 w-full"
              >
                End Session
              </button>
              <button
                onClick={handleStartGame}
                disabled={players.length === 0 || isStarting}
                className={`${players.length === 0 || isStarting ? 'btn-disabled cursor-not-allowed' : 'btn-primary'} mt-4 w-full`}
              >
                {isStarting ? <Loader />  : 'Pick Game'}
              </button>
            </div>
          </div>
        </div>
          
        <div className="flex flex-col flex-1 sup-min-nav bg-accent p-4 shadow-md">
          <h3 className="text-xl font-semibold text-accent-contrast mb-3">
            Players ({players.length})
          </h3>
          {players.length === 0 ? (
            <p className="text-accent-contrast/70">No players have joined yet.</p>
          ) : (
            <ul className="space-y-2">
              {players.map((player: any, idx: number) => (
                <li
                  key={idx}
                  className="bg-accent-contrast/20 text-accent-contrast px-3 py-2 rounded-md flex items-center justify-between hover:bg-accent-contrast/40 transition"
                >
                  <span>{player.name}</span>
                  <button
                    onClick={() => handleRemovePlayer(player.name)}
                    className="text-xs bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded"
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default Host;
