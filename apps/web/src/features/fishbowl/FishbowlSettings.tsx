import { motion } from 'framer-motion';
import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useGameActionMutation, useStartGameMutation } from '../../app/store/api/sessionsApi';
import { useAppDispatch } from '../../app/store/hooks';
import { openAlert } from '../../features/alert/alertSlice';
import Loader from '../../features/loader/Loader';
import { ISession } from '../../types/session.types';

interface Props {
  session: ISession;
}

const FishbowlSettings = ({ session }: Props) => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const [gameAction] = useGameActionMutation();
  const [startGame] = useStartGameMutation();

  const [wordsPerPlayer, setWordsPerPlayer] = useState(3);
  const [turnDuration, setTurnDuration] = useState(60);
  const [allowSkips, setAllowSkips] = useState(true);
  const [isStarting, setIsStarting] = useState(false);

  const [errors, setErrors] = useState({
    wordsPerPlayer: '',
    turnDuration: '',
  });

  const validate = () => {
    let valid = true;
    const newErrors = { wordsPerPlayer: '', turnDuration: '' };

    if (wordsPerPlayer < 1 || wordsPerPlayer > 10) {
      newErrors.wordsPerPlayer = 'Words per player must be between 1 and 10';
      valid = false;
    }

    if (turnDuration < 15 || turnDuration > 180) {
      newErrors.turnDuration = 'Turn duration must be between 15 and 180 seconds';
      valid = false;
    }

    if (session.players.length < 4) {
      dispatch(openAlert({
        open: true,
        closeable: true,
        severity: 'error',
        message: 'Fishbowl requires at least 4 players',
        anchor: { x: 'right', y: 'bottom' },
      }));
      valid = false;
    }

    setErrors(newErrors);

    if (!valid && Object.values(newErrors).some(e => e)) {
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
    setIsStarting(true);

    try {
      await gameAction({
        sessionId: id,
        action: 'updateData',
        payload: {
          data: {
            phase: 'word-submission',
            teams: {
              team1: { name: 'Team 1', players: [] },
              team2: { name: 'Team 2', players: [] },
            },
            fishbowl: [],
            remainingWords: [],
            currentWord: null,
            currentTeam: 'team1',
            currentPlayer: null,
            turnStartTime: null,
            scores: { team1: 0, team2: 0 },
            wordsGuessedThisTurn: [],
            wordsSkippedThisTurn: [],
            wordsSubmitted: {},
            currentRound: 0,
            roundHistory: [],
            settings: {
              wordsPerPlayer,
              turnDuration,
              allowSkips,
            },
          },
        },
      }).unwrap();

      await startGame(id).unwrap();
      navigate(`/host/${id}/game`);
    } catch (err) {
      console.error(err);
      dispatch(openAlert({
        open: true,
        closeable: true,
        severity: 'error',
        message: 'Failed to start game',
        anchor: { x: 'right', y: 'bottom' },
      }));
    } finally {
      setIsStarting(false);
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
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="bg-neutral2 rounded-xl border-2 border-neutral-contrast/10 p-8 text-center">
          <h1 className="text-4xl font-primary font-bold text-primary mb-2">
            Fishbowl Settings
          </h1>
          <p className="text-neutral-contrast/70">
            Configure your game before starting
          </p>
        </div>

        <div className="bg-neutral2 rounded-xl border-2 border-neutral-contrast/10 p-6 space-y-6">
          <div>
            <label className="block mb-2 text-neutral-contrast/70 font-medium">
              Words Per Player
            </label>
            <input
              type="number"
              value={wordsPerPlayer}
              min={1}
              max={10}
              onChange={(e) => setWordsPerPlayer(Number(e.target.value))}
              className="input-primary w-full"
            />
            <p className="text-sm text-neutral-contrast/50 mt-2">
              Each player will submit this many words to the fishbowl
            </p>
            {errors.wordsPerPlayer && (
              <p className="text-red-500 text-sm mt-1">{errors.wordsPerPlayer}</p>
            )}
          </div>

          <div>
            <label className="block mb-2 text-neutral-contrast/70 font-medium">
              Turn Duration (seconds)
            </label>
            <input
              type="number"
              value={turnDuration}
              min={15}
              max={180}
              onChange={(e) => setTurnDuration(Number(e.target.value))}
              className="input-primary w-full"
            />
            <p className="text-sm text-neutral-contrast/50 mt-2">
              How long each player has to give clues
            </p>
            {errors.turnDuration && (
              <p className="text-red-500 text-sm mt-1">{errors.turnDuration}</p>
            )}
          </div>

          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              id="allowSkips"
              checked={allowSkips}
              onChange={(e) => setAllowSkips(e.target.checked)}
              className="w-5 h-5 rounded border-2 border-neutral-contrast/30"
            />
            <label htmlFor="allowSkips" className="text-neutral-contrast/70">
              Allow players to skip words during their turn
            </label>
          </div>
        </div>

        <div className="bg-neutral2 rounded-xl border-2 border-neutral-contrast/10 p-6">
          <h2 className="text-2xl font-primary font-bold text-primary mb-4">Game Info</h2>
          <div className="space-y-2 text-neutral-contrast/70">
            <p>• Players: {session.players.length} (minimum 4 required)</p>
            <p>• Total words: {session.players.length * wordsPerPlayer}</p>
            <p>• Rounds: 3 (Describe It, Act It Out, One Word)</p>
            <p>• Each player will take turns giving clues to their team</p>
          </div>
        </div>

        <button
          onClick={handleStartGame}
          disabled={isStarting || session.players.length < 4}
          className={
            isStarting || session.players.length < 4
              ? 'btn-disabled w-full'
              : 'btn-primary w-full'
          }
        >
          {isStarting ? <Loader /> : 'Start Game'}
        </button>
      </div>
    </motion.div>
  );
};

export default FishbowlSettings;