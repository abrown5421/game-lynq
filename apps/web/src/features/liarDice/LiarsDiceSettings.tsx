import { motion } from 'framer-motion';
import { useState } from "react";
import { openAlert } from '../alert/alertSlice';
import { useAppDispatch } from '../../app/store/hooks';
import { useGameActionMutation, useStartGameMutation } from '../../app/store/api/sessionsApi';
import { useNavigate, useParams } from 'react-router-dom';
import Loader from '../loader/Loader';
import { PlayerDice } from './types';

const DEFAULT_STARTING_DICE = 5;

const LiarsDiceSettings = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const [gameAction] = useGameActionMutation();
  const [startGame] = useStartGameMutation();

  const [loadingGame, setLoadingGame] = useState(false);
  const [startingDice, setStartingDice] = useState(DEFAULT_STARTING_DICE);
  const [onesAreWild, setOnesAreWild] = useState(true);

  const [errors, setErrors] = useState({
    startingDice: '',
  });

  const validate = () => {
    let valid = true;
    const newErrors = { startingDice: '' };

    if (startingDice < 3 || startingDice > 10) {
      newErrors.startingDice = 'Starting dice must be between 3 and 10';
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

  const generateDiceForPlayer = (playerId: string, playerName: string, count: number): PlayerDice => {
    const dice = Array.from({ length: count }, (_, i) => ({
      value: Math.floor(Math.random() * 6) + 1,
      id: `${playerId}-die-${i}`,
    }));

    return {
      playerId,
      playerName,
      dice,
      diceCount: count,
    };
  };

  const handleStartGame = async () => {
    if (!validate() || !id) return;
    setLoadingGame(true);

    try {
      // Get current session to access players
      const sessionResponse = await fetch(
        `${import.meta.env.VITE_API_URL}/sessions/${id}`,
        { headers: { Accept: "application/json" } }
      );
      const session = await sessionResponse.json();

      // Generate dice for all players
      const playerDice = session.players.map((player: any) => 
        generateDiceForPlayer(
          player.userId || player.unId,
          player.name,
          startingDice
        )
      );

      // First player in the list starts
      const firstPlayerId = session.players[0].userId || session.players[0].unId;

      await gameAction({
        sessionId: id,
        action: "updateData",
        payload: {
          data: {
            phase: "playing",
            round: 1,
            playerDice,
            currentBid: null,
            currentTurnPlayerId: firstPlayerId,
            biddingHistory: [],
            roundResult: null,
            eliminatedPlayers: [],
            winner: null,
            settings: {
              startingDice,
              onesAreWild,
            },
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
        message: "Failed to start game.",
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
      <div className="max-w-4xl mx-auto space-y-6">

        <div className="bg-neutral2 rounded-xl border-2 border-neutral-contrast/10 p-8 text-center">
          <h1 className="text-4xl font-primary font-bold text-primary mb-2">
            Liar's Dice Settings
          </h1>
          <p className="text-neutral-contrast/70">
            Configure your game of bluffing and deception
          </p>
        </div>

        <div className="bg-neutral2 rounded-xl border-2 border-neutral-contrast/10 p-6 space-y-6">
          <div>
            <label className="block mb-2 text-neutral-contrast/70">Starting Dice per Player</label>
            <input
              type="number"
              value={startingDice}
              min={3}
              max={10}
              onChange={(e) => setStartingDice(Number(e.target.value))}
              className="input-primary w-full"
            />
            <p className="text-sm text-neutral-contrast/50 mt-1">
              Each player starts with this many dice (3-10)
            </p>
            {errors.startingDice && <p className="text-red-500 text-sm mt-1">{errors.startingDice}</p>}
          </div>

          <div className="bg-neutral3 rounded-lg p-4 border-2 border-neutral-contrast/10">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-lg mb-1">Ones Are Wild</h3>
                <p className="text-sm text-neutral-contrast/70">
                  When enabled, 1s count as any face value (classic rules)
                </p>
              </div>
              <button
                onClick={() => setOnesAreWild(!onesAreWild)}
                className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
                  onesAreWild ? 'bg-primary' : 'bg-neutral-contrast/20'
                }`}
              >
                <span
                  className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                    onesAreWild ? 'translate-x-7' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        <div className="bg-neutral2 rounded-xl border-2 border-primary/30 p-6">
          <h2 className="text-2xl font-primary font-bold text-primary mb-4">How to Play</h2>
          <div className="space-y-3 text-neutral-contrast/80">
            <p>🎲 Each player rolls dice secretly. Only you can see your own dice.</p>
            <p>🗣️ On your turn, make a bid about ALL dice in play (e.g., "Five 4s")</p>
            <p>📈 Each bid must be higher: more dice OR higher face value</p>
            <p>❌ Or call "Liar!" if you think the previous bid is impossible</p>
            <p>🎯 When challenged, all dice are revealed. Wrong party loses a die!</p>
            <p>🏆 Last player with dice remaining wins!</p>
            {onesAreWild && (
              <p className="text-primary">⭐ 1s are wild and count as any number!</p>
            )}
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

export default LiarsDiceSettings;