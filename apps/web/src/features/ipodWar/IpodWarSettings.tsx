import { motion } from 'framer-motion';
import { useState } from "react";
import { openAlert } from '../alert/alertSlice';
import { useAppDispatch } from '../../app/store/hooks';
import { useGameActionMutation, useStartGameMutation } from '../../app/store/api/sessionsApi';
import { useNavigate, useParams } from 'react-router-dom';
import Loader from '../loader/Loader';

type Genre = {
  name: string;
  image: string;
};

const GENRES: Genre[] = [
  { name: "Pop", image: "https://images.unsplash.com/photo-1512830414785-9928e23475dc?q=80&w=1170&auto=format&fit=crop" },
  { name: "Hip-Hop", image: "https://images.unsplash.com/photo-1601643157091-ce5c665179ab?q=80&w=1172&auto=format&fit=crop" },
  { name: "Rock", image: "https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?q=80&w=1170&auto=format&fit=crop" },
  { name: "Alternative", image: "https://plus.unsplash.com/premium_photo-1739485104667-77ffcc398a81?q=80&w=1170&auto=format&fit=crop" },
  { name: "Indie", image: "https://images.unsplash.com/photo-1481886756534-97af88ccb438?q=80&w=1632&auto=format&fit=crop" },
  { name: "Electronic", image: "https://images.unsplash.com/photo-1616709676522-9861033271a2?q=80&w=627&auto=format&fit=crop" },
  { name: "Dance", image: "https://images.unsplash.com/photo-1588540111535-2b7ef1eb7833?q=80&w=1172&auto=format&fit=crop" },
  { name: "R&B", image: "https://images.unsplash.com/photo-1535146851324-6571dc3f2672?q=80&w=1170&auto=format&fit=crop" },
  { name: "Jazz", image: "https://images.unsplash.com/flagged/photo-1569231290377-072234d3ee57?q=80&w=687&auto=format&fit=crop" },
  { name: "Blues", image: "https://images.unsplash.com/photo-1543372742-312f414ace57?q=80&w=687&auto=format&fit=crop" },
  { name: "Country", image: "https://images.unsplash.com/photo-1507404684477-09c7f690976a?q=80&w=1170&auto=format&fit=crop" },
  { name: "Folk", image: "https://images.unsplash.com/photo-1521337581100-8ca9a73a5f79?q=80&w=1077&auto=format&fit=crop" },
  { name: "Latin", image: "https://images.unsplash.com/photo-1634137622977-34ef2eda193f?q=80&w=1167&auto=format&fit=crop" },
  { name: "Lo-Fi", image: "https://images.unsplash.com/photo-1558843196-6a1ed3250d80?q=80&w=1632&auto=format&fit=crop" },
  { name: "House", image: "https://images.unsplash.com/photo-1615743893538-c502749d04a0?q=80&w=733&auto=format&fit=crop" },
  { name: "Techno", image: "https://images.unsplash.com/photo-1578736641330-3155e606cd40?q=80&w=1170&auto=format&fit=crop" },
];

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
  const [selectedGenre, setSelectedGenre] = useState<string | null>(null);
  const [trackCount, setTrackCount] = useState(DEFAULT_TRACKS);
  const [roundDuration, setRoundDuration] = useState(DEFAULT_ROUND_DURATION);

  const [errors, setErrors] = useState({
    genre: '',
    trackCount: '',
    roundDuration: '',
  });

  const validate = () => {
    let valid = true;
    const newErrors = { genre: '', trackCount: '', roundDuration: '' };

    if (!selectedGenre) {
      newErrors.genre = 'Please select a genre';
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
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/integrations/itunes/search?genre=${selectedGenre}&trackCount=200`,
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
            settings: { genre: selectedGenre, trackCount, roundDuration },
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
            Choose a genre and configure your game round.
          </p>
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

        <div className="bg-neutral2 rounded-xl border-2 border-neutral-contrast/10 p-6">
          <h2 className="text-2xl font-primary font-bold text-primary mb-4">Select Genre</h2>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {GENRES.map((genre) => {
              const isSelected = selectedGenre === genre.name;
              return (
                <button
                  key={genre.name}
                  onClick={() => setSelectedGenre(genre.name)}
                  style={{
                    backgroundImage: `url(${genre.image})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                  }}
                  className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all
                    ${isSelected ? 'border-primary scale-105' : 'border-neutral hover:border-primary'}
                  `}
                >
                  <div className={`absolute inset-0 ${isSelected ? 'bg-neutral/80' : 'bg-neutral/60 hover:bg-neutral/80'}`} />
                  <span className="relative z-10 text-xl font-bold text-white">
                    {genre.name}
                  </span>
                </button>
              );
            })}
          </div>

          {errors.genre && <p className="text-red-500 text-sm mt-3">{errors.genre}</p>}
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
