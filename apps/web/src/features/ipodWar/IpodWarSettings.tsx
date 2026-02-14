import { motion } from 'framer-motion';
import { useState } from "react";
import { openAlert } from '../alert/alertSlice';
import { useAppDispatch } from '../../app/store/hooks';
import { useGameActionMutation, useStartGameMutation } from '../../app/store/api/sessionsApi';
import { useNavigate, useParams } from 'react-router-dom';
import Loader from '../loader/Loader';

const MIN_TRACKS = 20;
const MAX_TRACKS = 200;
const DEFAULT_TRACKS = 60;
const DEFAULT_ROUND_DURATION = 60;

const IpodWarSettings = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const [gameAction] = useGameActionMutation();
  const [startGame] = useStartGameMutation();

  const [loadingGame, setLoadingGame] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [trackCount, setTrackCount] = useState(DEFAULT_TRACKS);
  const [roundDuration, setRoundDuration] = useState(DEFAULT_ROUND_DURATION);
  const [guessArtist, setGuessArtist] = useState(true);
  const [errors, setErrors] = useState({
    searchTerm: '',
    trackCount: '',
    roundDuration: '',
  });

  const validate = () => {
    let valid = true;
    const newErrors = { searchTerm: '', trackCount: '', roundDuration: '' };

    if (!searchTerm.trim()) {
      newErrors.searchTerm = 'Please enter a search term';
      valid = false;
    }

    if (trackCount < MIN_TRACKS || trackCount > MAX_TRACKS) {
      newErrors.trackCount = `Tracks must be between ${MIN_TRACKS} and ${MAX_TRACKS}`;
      valid = false;
    }

    if (roundDuration < 5) {
      newErrors.roundDuration = 'Round duration must be at least 5 seconds';
      valid = false;
    }

    setErrors(newErrors);

    if (!valid) {
      dispatch(openAlert({
        open: true,
        closeable: true,
        severity: 'error',
        message: 'Please fix the errors in the form',
        anchor: { x: 'right', y: 'bottom' },
      }));
    }

    return valid;
  };

  const handleStartGame = async () => {
    if (!validate() || !id) return;
    setLoadingGame(true);

    try {
      console.log(`${import.meta.env.VITE_API_URL}/integrations/itunes/search?term=${encodeURIComponent(searchTerm)}&limit=200`)
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/integrations/itunes/search?term=${encodeURIComponent(searchTerm)}&limit=200`,
        { headers: { Accept: "application/json" } }
      );

      const data = await response.json();

      const tracks = data.tracks
        .sort(() => Math.random() - 0.5)
        .slice(0, trackCount)
        .map((t: any) => ({
          name: t.trackName,
          artist: t.artistName,
          previewUrl: t.previewUrl,
          artwork: t.artworkUrl100,
        }));

      await gameAction({
        sessionId: id,
        action: "updateData",
        payload: {
          data: {
            currentTrack: tracks[0],
            tracks,
            round: 0,
            roundStartTime: Date.now(),
            submissions: [],
            revealedAnswer: null,
            readyPlayers: [],
            phase: "playing",
            settings: { searchTerm, trackCount, roundDuration, guessArtist },
          },
        },
      });

      await startGame(id);
      navigate(`/host/${id}/game`);

    } catch (err) {
      console.error(err);
      dispatch(openAlert({
        open: true,
        closeable: true,
        severity: "error",
        message: "Failed to fetch tracks.",
        anchor: { x: "right", y: "bottom" },
      }));
    } finally {
      setLoadingGame(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      className="bg-neutral text-neutral-contrast min-h-screen p-6"
    >
      <div className="max-w-6xl mx-auto space-y-6">

        <div className="bg-neutral2 rounded-xl border-2 border-neutral-contrast/10 p-8 text-center">
          <h1 className="text-4xl font-primary font-bold text-primary mb-2">
            Ipod War Settings
          </h1>
          <p className="text-neutral-contrast/70">
            Search for any artist, genre, or vibe.
          </p>
        </div>

        <div className="bg-neutral2 rounded-xl border-2 border-neutral-contrast/10 p-6 space-y-6">
          <div>
            <label className="block mb-2 text-neutral-contrast/70">Search for Anything</label>
            <input
              type="text"
              placeholder='Try: "Pop", "Taylor Swift", "Summer jams of the 2000s"'
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-primary w-full"
            />
            {errors.searchTerm && <p className="text-red-500 text-sm mt-1">{errors.searchTerm}</p>}
          </div>
          <div className="bg-neutral2 rounded-xl border-2 border-neutral-contrast/10 p-6 space-y-4">
            <label className="flex items-center justify-between">
              <span className="text-neutral-contrast/70">Enable Artist Guessing</span>
              <input
                type="checkbox"
                checked={guessArtist}
                onChange={(e) => setGuessArtist(e.target.checked)}
                className="toggle"
              />
            </label>
          </div>
        </div>

        <div className="bg-neutral2 rounded-xl border-2 border-neutral-contrast/10 p-6 space-y-6">
          <div>
            <label className="block mb-2 text-neutral-contrast/70">Number of Tracks</label>
            <input
              type="number"
              value={trackCount}
              min={MIN_TRACKS}
              max={MAX_TRACKS}
              onChange={(e) => setTrackCount(Number(e.target.value))}
              className="input-primary w-full"
            />
            {errors.trackCount && <p className="text-red-500 text-sm mt-1">{errors.trackCount}</p>}
          </div>

          <div>
            <label className="block mb-2 text-neutral-contrast/70">Round Duration (seconds)</label>
            <input
              type="number"
              value={roundDuration}
              onChange={(e) => setRoundDuration(Number(e.target.value))}
              className="input-primary w-full"
            />
            {errors.roundDuration && <p className="text-red-500 text-sm mt-1">{errors.roundDuration}</p>}
          </div>
        </div>

        <button
          onClick={handleStartGame}
          disabled={loadingGame}
          className={loadingGame ? "btn-disabled w-full" : "btn-primary w-full"}
        >
          {loadingGame ? <Loader /> : "Start Game"}
        </button>

      </div>
    </motion.div>
  );
};

export default IpodWarSettings;
