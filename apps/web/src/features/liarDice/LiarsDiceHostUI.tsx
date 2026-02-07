import { motion } from 'framer-motion';
import { useState } from 'react';
import { LiarsDiceGameData, PlayerDice, Die } from './types';
import { useGameActionMutation, useGetSessionByIdQuery } from '../../app/store/api/sessionsApi';
import { ISession } from '../../types/session.types';
import Loader from '../loader/Loader';

interface Props {
  session: ISession;
}

const LiarsDiceHostUI = ({ session }: Props) => {
  const [gameAction] = useGameActionMutation();
  const { refetch } = useGetSessionByIdQuery(session._id, { 
    pollingInterval: 1000 
  });
  const [isProcessing, setIsProcessing] = useState(false);

  if (!session.gameState?.data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral">
        <Loader />
      </div>
    );
  }

  const gameData = session.gameState.data as LiarsDiceGameData;
  const { 
    phase, 
    round, 
    playerDice, 
    currentBid, 
    currentTurnPlayerId,
    biddingHistory,
    roundResult,
    settings,
    eliminatedPlayers,
    winner
  } = gameData;

  const activePlayers = playerDice.filter(pd => !eliminatedPlayers.includes(pd.playerId));
  const currentPlayer = activePlayers.find(pd => pd.playerId === currentTurnPlayerId);

  const countDice = (faceValue: number): number => {
    let count = 0;
    activePlayers.forEach(pd => {
      pd.dice.forEach(die => {
        if (die.value === faceValue) count++;
        if (settings.onesAreWild && die.value === 1 && faceValue !== 1) count++;
      });
    });
    return count;
  };

  const handleNextRound = async () => {
    if (isProcessing) return;
    setIsProcessing(true);

    try {
      const freshSession = await refetch().unwrap();
      const freshGameData = freshSession.gameState?.data as LiarsDiceGameData;
      
      // Find who lost the previous round
      const loser = freshGameData.roundResult!.loser;
      
      // Update player dice - loser loses one die
      const updatedPlayerDice = freshGameData.playerDice.map(pd => {
        if (pd.playerId === loser) {
          const newDice = pd.dice.slice(0, -1).map((d, i) => ({
            value: Math.floor(Math.random() * 6) + 1,
            id: `${pd.playerId}-die-${i}`,
          }));
          return { ...pd, dice: newDice, diceCount: newDice.length };
        } else {
          // Re-roll all dice for other players
          const newDice = Array.from({ length: pd.diceCount }, (_, i) => ({
            value: Math.floor(Math.random() * 6) + 1,
            id: `${pd.playerId}-die-${i}`,
          }));
          return { ...pd, dice: newDice };
        }
      });

      // Check for eliminated players (0 dice)
      const newEliminatedPlayers = [...freshGameData.eliminatedPlayers];
      updatedPlayerDice.forEach(pd => {
        if (pd.diceCount === 0 && !newEliminatedPlayers.includes(pd.playerId)) {
          newEliminatedPlayers.push(pd.playerId);
        }
      });

      // Check for winner (only 1 player left)
      const remainingPlayers = updatedPlayerDice.filter(pd => pd.diceCount > 0);
      
      if (remainingPlayers.length === 1) {
        await gameAction({
          sessionId: session._id,
          action: 'updateData',
          payload: {
            data: {
              phase: 'gameOver',
              playerDice: updatedPlayerDice,
              eliminatedPlayers: newEliminatedPlayers,
              winner: {
                playerId: remainingPlayers[0].playerId,
                playerName: remainingPlayers[0].playerName,
              },
            },
          },
        }).unwrap();
      } else {
        // Continue to next round - loser starts bidding
        await gameAction({
          sessionId: session._id,
          action: 'updateData',
          payload: {
            data: {
              phase: 'playing',
              round: freshGameData.round + 1,
              playerDice: updatedPlayerDice,
              currentBid: null,
              currentTurnPlayerId: loser,
              biddingHistory: [],
              roundResult: null,
              eliminatedPlayers: newEliminatedPlayers,
            },
          },
        }).unwrap();
      }
      
    } catch (err) {
      console.error('Failed to start next round:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  // CSS-based dice with dots
  const DiceWithDots = ({ value }: { value: number }) => {
    const renderDots = () => {
      const dots = [];
      const positions = {
        1: [[50, 50]],
        2: [[25, 25], [75, 75]],
        3: [[25, 25], [50, 50], [75, 75]],
        4: [[25, 25], [75, 25], [25, 75], [75, 75]],
        5: [[25, 25], [75, 25], [50, 50], [25, 75], [75, 75]],
        6: [[25, 25], [75, 25], [25, 50], [75, 50], [25, 75], [75, 75]],
      };

      const dotPositions = positions[value as keyof typeof positions] || [];
      
      return dotPositions.map((pos, i) => (
        <div
          key={i}
          className="absolute w-2 h-2 bg-gray-800 rounded-full"
          style={{
            left: `${pos[0]}%`,
            top: `${pos[1]}%`,
            transform: 'translate(-50%, -50%)',
          }}
        />
      ));
    };

    return (
      <div className="w-12 h-12 bg-white rounded-lg border-2 border-gray-300 shadow-md relative flex-shrink-0">
        {renderDots()}
      </div>
    );
  };

  const DiceDisplay = ({ dice }: { dice: Die[] }) => {
    if (!dice || dice.length === 0) {
      return (
        <div className="text-center text-neutral-contrast/50 py-4">
          No dice to display
        </div>
      );
    }

    return (
      <div className="flex gap-2 flex-wrap justify-center">
        {dice.map(die => (
          <DiceWithDots key={die.id} value={die.value} />
        ))}
      </div>
    );
  };

  const getDieFaceIcon = (value: number) => {
    const icons = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];
    return icons[value - 1] || value.toString();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      className="bg-neutral text-neutral-contrast min-h-screen p-6"
    >
      {phase === 'playing' && (
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="bg-neutral2 rounded-xl border-2 border-neutral-contrast/10 p-8 text-center">
            <h1 className="text-4xl font-primary font-bold text-primary mb-2">
              Round {round}
            </h1>
            <p className="text-xl text-neutral-contrast/70">
              Current Turn: <span className="text-primary font-bold">{currentPlayer?.playerName}</span>
            </p>
            {settings.onesAreWild && (
              <p className="text-sm text-primary/70 mt-2">⭐ 1s are wild</p>
            )}
          </div>

          {currentBid && (
            <div className="bg-gradient-to-r from-primary/20 to-accent/20 rounded-xl border-2 border-primary/40 p-6">
              <h2 className="text-2xl font-primary font-bold text-primary mb-2 text-center">
                Current Bid
              </h2>
              <div className="text-center">
                <div className="text-5xl font-bold text-primary mb-2">
                  {currentBid.quantity} × {getDieFaceIcon(currentBid.faceValue)}
                </div>
                <p className="text-neutral-contrast/70">
                  by <span className="font-bold">{currentBid.playerName}</span>
                </p>
              </div>
            </div>
          )}

          <div className="bg-neutral2 rounded-xl border-2 border-neutral-contrast/10 p-6">
            <h2 className="text-2xl font-primary font-bold text-primary mb-4">Bidding History</h2>
            {biddingHistory.length === 0 ? (
              <div className="text-center py-8 text-neutral-contrast/50">
                No bids yet - waiting for first bid...
              </div>
            ) : (
              <div className="space-y-2">
                {[...biddingHistory].reverse().map((bid, i) => (
                  <div key={i} className="bg-neutral3 p-4 rounded-lg border-2 border-neutral-contrast/10 flex justify-between items-center">
                    <span className="font-medium">{bid.playerName}</span>
                    <span className="text-xl font-bold text-primary">
                      {bid.quantity} × {getDieFaceIcon(bid.faceValue)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-neutral2 rounded-xl border-2 border-neutral-contrast/10 p-6">
            <h2 className="text-2xl font-primary font-bold text-primary mb-4">Players</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {activePlayers.map(pd => {
                const isCurrentTurn = pd.playerId === currentTurnPlayerId;
                return (
                  <div 
                    key={pd.playerId}
                    className={`p-4 rounded-lg border-2 ${
                      isCurrentTurn 
                        ? 'bg-primary/10 border-primary/50' 
                        : 'bg-neutral3 border-neutral-contrast/10'
                    }`}
                  >
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-bold text-lg">{pd.playerName}</span>
                      <span className="text-2xl font-bold text-primary">{pd.diceCount} 🎲</span>
                    </div>
                    {isCurrentTurn && (
                      <div className="text-sm text-primary">← Making their move...</div>
                    )}
                  </div>
                );
              })}
            </div>
            
            {eliminatedPlayers.length > 0 && (
              <div className="mt-6 pt-6 border-t-2 border-neutral-contrast/10">
                <h3 className="text-lg font-bold text-neutral-contrast/50 mb-2">Eliminated</h3>
                <div className="flex flex-wrap gap-2">
                  {eliminatedPlayers.map(playerId => {
                    const player = playerDice.find(pd => pd.playerId === playerId);
                    return (
                      <div key={playerId} className="bg-neutral3/50 px-3 py-1 rounded text-neutral-contrast/50">
                        {player?.playerName}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {phase === 'revealing' && roundResult && (
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="bg-neutral2 rounded-xl border-2 border-neutral-contrast/10 p-8 text-center">
            <h1 className="text-4xl font-primary font-bold text-primary mb-4">Challenge Result!</h1>
            <p className="text-xl text-neutral-contrast/70">
              <span className="font-bold">{roundResult.challengerName}</span> called liar on{' '}
              <span className="font-bold">{roundResult.bidderName}</span>
            </p>
          </div>

          <div className="bg-gradient-to-r from-primary/20 to-accent/20 rounded-xl border-2 border-primary/40 p-8 text-center">
            <h2 className="text-2xl font-primary font-bold mb-4">The Bid</h2>
            <div className="text-6xl font-bold text-primary mb-4">
              {roundResult.bid.quantity} × {getDieFaceIcon(roundResult.bid.faceValue)}
            </div>
            <div className="text-3xl font-bold mb-2">
              Actual Count: <span className="text-primary">{roundResult.actualCount}</span>
            </div>
            <div className={`text-2xl font-bold ${roundResult.wasCorrect ? 'text-green-500' : 'text-red-500'}`}>
              {roundResult.wasCorrect ? '✓ Bid was TRUE!' : '✗ Bid was FALSE!'}
            </div>
          </div>

          <div className="bg-neutral2 rounded-xl border-2 border-neutral-contrast/10 p-6">
            <h2 className="text-2xl font-primary font-bold text-primary mb-6 text-center">All Dice Revealed</h2>
            <div className="space-y-4">
              {roundResult.allPlayerDice
                .filter(pd => !eliminatedPlayers.includes(pd.playerId))
                .map(pd => (
                  <div key={pd.playerId} className="bg-neutral3 p-4 rounded-lg border-2 border-neutral-contrast/10">
                    <div className="font-bold text-lg mb-3">{pd.playerName}</div>
                    <DiceDisplay dice={pd.dice} />
                  </div>
                ))}
            </div>
          </div>

          <div className={`rounded-xl border-2 p-8 text-center ${
            roundResult.wasCorrect ? 'bg-red-500/20 border-red-500/50' : 'bg-green-500/20 border-green-500/50'
          }`}>
            <h2 className="text-3xl font-bold mb-2">
              {roundResult.loserName} loses a die! 🎲
            </h2>
            <p className="text-neutral-contrast/70">
              {roundResult.wasCorrect 
                ? `${roundResult.challengerName} was wrong to challenge` 
                : `${roundResult.bidderName}'s bid was impossible`}
            </p>
          </div>

          <button
            onClick={handleNextRound}
            disabled={isProcessing}
            className={isProcessing ? 'btn-disabled w-full' : 'btn-primary w-full'}
          >
            {isProcessing ? <Loader /> : 'Next Round'}
          </button>
        </div>
      )}

      {phase === 'gameOver' && winner && (
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="bg-gradient-to-r from-primary/30 to-accent/30 rounded-xl border-2 border-primary/50 p-12 text-center">
            <h1 className="text-6xl font-primary font-bold text-primary mb-4">
              🏆 Game Over! 🏆
            </h1>
            <h2 className="text-4xl font-bold mb-2">{winner.playerName} Wins!</h2>
            <p className="text-xl text-neutral-contrast/70">
              The ultimate bluffer and survivor!
            </p>
          </div>

          <div className="bg-neutral2 rounded-xl border-2 border-neutral-contrast/10 p-6">
            <h2 className="text-2xl font-primary font-bold text-primary mb-4 text-center">
              Final Standings
            </h2>
            <div className="space-y-3">
              {playerDice
                .sort((a, b) => b.diceCount - a.diceCount)
                .map((pd, i) => (
                  <div 
                    key={pd.playerId}
                    className={`p-4 rounded-lg border-2 flex justify-between items-center ${
                      i === 0 
                        ? 'bg-primary/20 border-primary/50' 
                        : 'bg-neutral3 border-neutral-contrast/10'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${
                        i === 0 ? 'bg-primary/30 border-primary/50' : 'bg-primary/20 border-primary/30'
                      }`}>
                        <span className="text-primary font-bold">{i + 1}</span>
                      </div>
                      <span className="font-medium text-lg">
                        {pd.playerName} {i === 0 && '👑'}
                      </span>
                    </div>
                    <span className="text-2xl font-bold text-primary">
                      {pd.diceCount} {pd.diceCount === 1 ? 'die' : 'dice'}
                    </span>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default LiarsDiceHostUI;