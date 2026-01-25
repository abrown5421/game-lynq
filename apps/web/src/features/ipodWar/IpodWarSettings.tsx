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
  const [loadingGame, setLoadingGame] = useState<boolean>(false);
  const [selectedGenre, setSelectedGenre] = useState<string | null>(null);
  const [trackCount, setTrackCount] = useState<number>(DEFAULT_TRACKS);
  const [roundDuration, setRoundDuration] = useState<number>(DEFAULT_ROUND_DURATION);

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

    if (!trackCount || trackCount < MIN_TRACKS || trackCount > MAX_TRACKS) {
      newErrors.trackCount = `Tracks must be between ${MIN_TRACKS} and ${MAX_TRACKS}`;
      valid = false;
    }

    if (!roundDuration || roundDuration < 5) {
      newErrors.roundDuration = 'Round duration must be at least 5 seconds';
      valid = false;
    }

    setErrors(newErrors);

    if (!valid) {
      dispatch(
        openAlert({
          open: true,
          closeable: true,
          severity: 'error',
          message: 'Please fix the errors in the form',
          anchor: { x: 'right', y: 'bottom' },
        })
      );
    }

    return valid;
  };

  const shuffleArray = <T,>(array: T[]): T[] => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  const handleStartGame = async () => {
    setLoadingGame(true)
    if (!validate() || !id) return;

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/integrations/itunes/search?genre=${selectedGenre}&trackCount=200`,
        { headers: { "Accept": "application/json" } }
      );

      const data = await response.json();

      const allTracks = data.tracks.map((track: any) => ({
        name: track.trackName,
        artist: track.artistName,
        previewUrl: track.previewUrl,
        artwork: track.artworkUrl100,
      }));

      const shuffledTracks = shuffleArray(allTracks);
      const selectedTracks = shuffledTracks.slice(0, trackCount);

      await gameAction({
        sessionId: id,
        action: "updateData",
        payload: {
          data: {
            currentTrack: selectedTracks[0],
            revealedAnswer: null,
            readyPlayers: [],
            round: 0,
            tracks: selectedTracks,
            settings: {
              genre: selectedGenre,
              trackCount,
              roundDuration,
            },
            submissions: [],
            roundStartTime: Date.now(),
            phase: 'playing',
          }
        }
      });
      setLoadingGame(false)
      await startGame(id);

      navigate(`/host/${id}/game`);

    } catch (err) {
      console.error(err);
      dispatch(
        openAlert({
          open: true,
          closeable: true,
          severity: "error",
          message: "Failed to fetch tracks. Please try again later.",
          anchor: { x: "right", y: "bottom" },
        })
      );
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        <div className="flex flex-col gap-6">

          <div>
            <h1 className="text-3xl font-bold">Ipod War</h1>
            <p className="opacity-70 mt-2">
              Choose a genre, set the number of tracks, and decide how long players
              have to guess each song before time runs out.
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <label>Number of Tracks</label>
            <input
              type="number"
              min={MIN_TRACKS}
              max={MAX_TRACKS}
              value={trackCount}
              onChange={(e) => {
                setTrackCount(Number(e.target.value));
                setErrors({ ...errors, trackCount: '' });
              }}
              className={`w-full rounded border bg-neutral p-2 
                ${errors.trackCount ? 'border-red-500' : 'border-neutral-contrast'}
              `}
            />
            {errors.trackCount && (
              <span className="text-red-500 text-sm">{errors.trackCount}</span>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <label>Round Duration (seconds)</label>
            <input
              type="number"
              min={30}
              value={roundDuration}
              onChange={(e) => {
                setRoundDuration(Number(e.target.value));
                setErrors({ ...errors, roundDuration: '' });
              }}
              className={`w-full rounded border bg-neutral p-2 
                ${errors.roundDuration ? 'border-red-500' : 'border-neutral-contrast'}
              `}
            />
            {errors.roundDuration && (
              <span className="text-red-500 text-sm">{errors.roundDuration}</span>
            )}
          </div>

          <button
            onClick={handleStartGame}
            className="mt-4 w-full px-6 py-3 rounded bg-primary text-white font-bold hover:brightness-110"
          >
            {loadingGame ? <Loader /> : "Start Game"}
          </button>

        </div>

        <div className="grid gap-3 sm:gap-4 md:gap-5 grid-cols-2 lg:grid-cols-4">
          {GENRES.map((genre) => {
            const isSelected = selectedGenre === genre.name;
            const hasError = errors.genre && !selectedGenre;

            return (
              <button
                key={genre.name}
                onClick={() => {
                  setSelectedGenre(genre.name);
                  setErrors({ ...errors, genre: '' });
                }}
                style={{
                  backgroundImage: `url(${genre.image})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }}
                className={`
                  relative w-full aspect-square border rounded overflow-hidden
                  flex items-center justify-center text-white transition-all
                  hover:border-primary hover:brightness-110
                  ${
                    isSelected
                      ? "border-primary scale-105 brightness-110"
                      : hasError
                        ? "border-red-500"
                        : "border-neutral-contrast"
                  }
                `}
              >
                <div className={`absolute inset-0 ${isSelected ? "bg-neutral/85" : "bg-neutral/65 hover:bg-neutral/85"}`} />
                <span className="relative text-2xl font-bold z-10">
                  {genre.name}
                </span>
              </button>
            );
          })}
        </div>

        {errors.genre && (
          <span className="text-red-500 text-sm col-span-full">
            {errors.genre}
          </span>
        )}

      </div>
    </motion.div>
  );
};

export default IpodWarSettings;