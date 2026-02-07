import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { LiarsDiceGameData, Die } from './types';
import { useGameActionMutation, useGetSessionByIdQuery } from '../../app/store/api/sessionsApi';
import { useParams } from 'react-router-dom';
import { ISession } from '../../types/session.types';
import Loader from '../loader/Loader';

interface Props {
  session: ISession;
}

const LiarsDicePlayerUI = ({ session }: Props) => {
  const { playerId } = useParams<{ playerId: string }>();
  const [gameAction] = useGameActionMutation();
  const { refetch } = useGetSessionByIdQuery(session._id, {
    pollingInterval: 1000
  });

  const [quantity, setQuantity] = useState(1);
  const [faceValue, setFaceValue] = useState(2);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const player = session.players.find(p => p.userId === playerId || p.unId === playerId);
  const playerName = player?.name || 'Unknown';
  const myDice = playerDice.find(pd => pd.playerId === playerId);
  const isMyTurn = currentTurnPlayerId === playerId;
  const isEliminated = eliminatedPlayers.includes(playerId || '');

  const activePlayers = playerDice.filter(pd => !eliminatedPlayers.includes(pd.playerId));
  const totalDiceInPlay = activePlayers.reduce((sum, pd) => sum + pd.diceCount, 0);

  useEffect(() => {
    if (currentBid) {
      setQuantity(currentBid.quantity);
      setFaceValue(currentBid.faceValue);
    } else {
      setQuantity(1);
      setFaceValue(2);
    }
  }, [currentBid]);

  const canMakeBid = (qty: number, face: number): boolean => {
    if (!currentBid) return true;
    
    if (qty > currentBid.quantity) return true;
    if (qty === currentBid.quantity && face > currentBid.faceValue) return true;
    
    return false;
  };

  const handleMakeBid = async () => {
    if (!playerId || isSubmitting || !canMakeBid(quantity, faceValue)) return;

    setIsSubmitting(true);

    try {
      const freshSession = await refetch().unwrap();
      const freshGameData = freshSession.gameState?.data as LiarsDiceGameData;

      const newBid = {
        playerId,
        playerName,
        quantity,
        faceValue,
        timestamp: Date.now(),
      };

      const updatedHistory = [...freshGameData.biddingHistory, newBid];

      // Find next player
      const activePlayerIds = freshGameData.playerDice
        .filter(pd => !freshGameData.eliminatedPlayers.includes(pd.playerId))
        .map(pd => pd.playerId);
      
      const currentIndex = activePlayerIds.indexOf(playerId);
      const nextIndex = (currentIndex + 1) % activePlayerIds.length;
      const nextPlayerId = activePlayerIds[nextIndex];

      await gameAction({
        sessionId: session._id,
        action: 'updateData',
        payload: {
          data: {
            currentBid: newBid,
            currentTurnPlayerId: nextPlayerId,
            biddingHistory: updatedHistory,
          },
        },
      }).unwrap();

    } catch (err) {
      console.error('Failed to make bid:', err);
      alert('Failed to make bid. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCallLiar = async () => {
    if (!playerId || isSubmitting || !currentBid) return;

    setIsSubmitting(true);

    try {
      const freshSession = await refetch().unwrap();
      const freshGameData = freshSession.gameState?.data as LiarsDiceGameData;

      // Count actual dice matching the bid
      let actualCount = 0;
      freshGameData.playerDice
        .filter(pd => !freshGameData.eliminatedPlayers.includes(pd.playerId))
        .forEach(pd => {
          pd.dice.forEach(die => {
            if (die.value === freshGameData.currentBid!.faceValue) actualCount++;
            if (settings.onesAreWild && die.value === 1 && freshGameData.currentBid!.faceValue !== 1) {
              actualCount++;
            }
          });
        });

      const bidWasCorrect = actualCount >= freshGameData.currentBid!.quantity;
      const loser = bidWasCorrect ? playerId : freshGameData.currentBid!.playerId;
      const loserName = bidWasCorrect ? playerName : freshGameData.currentBid!.playerName;

      const result = {
        challenger: playerId,
        challengerName: playerName,
        bidder: freshGameData.currentBid!.playerId,
        bidderName: freshGameData.currentBid!.playerName,
        bid: freshGameData.currentBid!,
        actualCount,
        wasCorrect: bidWasCorrect,
        loser,
        loserName,
        allPlayerDice: freshGameData.playerDice,
      };

      await gameAction({
        sessionId: session._id,
        action: 'updateData',
        payload: {
          data: {
            phase: 'revealing',
            roundResult: result,
          },
        },
      }).unwrap();

    } catch (err) {
      console.error('Failed to call liar:', err);
      alert('Failed to call liar. Please try again.');
    } finally {
      setIsSubmitting(false);
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
          className="absolute w-2 h-2 sm:w-2.5 sm:h-2.5 bg-gray-800 rounded-full"
          style={{
            left: `${pos[0]}%`,
            top: `${pos[1]}%`,
            transform: 'translate(-50%, -50%)',
          }}
        />
      ));
    };

    return (
      <div className="w-14 h-14 sm:w-16 sm:h-16 bg-white rounded-lg sm:rounded-xl border-2 border-gray-300 shadow-lg relative flex-shrink-0">
        {renderDots()}
      </div>
    );
  };

  const DiceDisplay = ({ dice }: { dice: Die[] }) => {
    if (!dice || dice.length === 0) {
      return (
        <div className="text-center text-neutral-contrast/50 py-4">
          No dice available
        </div>
      );
    }

    return (
      <div className="flex gap-2 sm:gap-3 flex-wrap justify-center items-center max-w-full">
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
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="bg-neutral2 rounded-xl border-2 border-neutral-contrast/10 p-6">
          <div className="flex justify-between items-center">
            <div>
              <div className="text-sm text-neutral-contrast/70">Player</div>
              <div className="text-2xl font-primary font-bold text-primary">{playerName}</div>
            </div>
            <div className="text-right">
              <div className="text-sm text-neutral-contrast/70">Dice Remaining</div>
              <div className="text-4xl font-primary font-bold text-primary">{myDice?.diceCount || 0}</div>
            </div>
          </div>
        </div>

        {phase === 'playing' && !isEliminated && (
          <div className="space-y-6">
            <div className="bg-neutral2 rounded-xl border-2 border-neutral-contrast/10 p-8 text-center">
              <h1 className="text-3xl font-primary font-bold text-primary mb-2">
                Round {round}
              </h1>
              <div className="text-lg text-neutral-contrast/70 mb-2">
                Total dice in play: <span className="font-bold text-primary">{totalDiceInPlay}</span>
              </div>
              {settings.onesAreWild && (
                <p className="text-sm text-primary/70">⭐ 1s are wild</p>
              )}
            </div>

            {myDice && myDice.dice && myDice.dice.length > 0 && (
              <div className="bg-neutral2 rounded-xl border-2 border-primary/30 p-6">
                <h2 className="text-xl font-primary font-bold text-primary mb-4 text-center">
                  Your Dice
                </h2>
                <DiceDisplay dice={myDice.dice} />
              </div>
            )}

            {currentBid && (
              <div className="bg-gradient-to-r from-primary/20 to-accent/20 rounded-xl border-2 border-primary/40 p-6">
                <h2 className="text-xl font-primary font-bold text-primary mb-2 text-center">
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

            {isMyTurn ? (
              <div className="bg-neutral2 rounded-xl border-2 border-primary/50 p-6 space-y-4">
                <h2 className="text-2xl font-primary font-bold text-primary text-center">
                  Your Turn!
                </h2>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2 text-neutral-contrast/70">
                      Quantity
                    </label>
                    <input
                      type="number"
                      value={quantity}
                      onChange={(e) => setQuantity(Number(e.target.value))}
                      min={1}
                      max={totalDiceInPlay}
                      className="input-primary w-full text-center text-2xl"
                      disabled={isSubmitting}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2 text-neutral-contrast/70">
                      Face Value
                    </label>
                    <div className="grid grid-cols-6 gap-1.5 sm:gap-2">
                      {[1, 2, 3, 4, 5, 6].map(face => (
                        <button
                          key={face}
                          onClick={() => setFaceValue(face)}
                          disabled={isSubmitting}
                          className={`p-1.5 sm:p-2 rounded-lg border-2 transition-all flex items-center justify-center ${
                            faceValue === face
                              ? 'bg-primary/30 border-primary/50 scale-105'
                              : 'bg-neutral3 border-neutral-contrast/10 hover:border-primary/30'
                          }`}
                        >
                          <DiceWithDots value={face} />
                        </button>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={handleMakeBid}
                    disabled={isSubmitting || !canMakeBid(quantity, faceValue)}
                    className={
                      isSubmitting || !canMakeBid(quantity, faceValue)
                        ? 'btn-disabled w-full'
                        : 'btn-primary w-full'
                    }
                  >
                    {isSubmitting ? <Loader /> : `Bid: ${quantity} × ${faceValue}`}
                  </button>

                  {currentBid && (
                    <button
                      onClick={handleCallLiar}
                      disabled={isSubmitting}
                      className={
                        isSubmitting
                          ? 'btn-disabled w-full'
                          : 'w-full bg-red-500 hover:bg-red-600 text-white font-bold py-3 px-6 rounded-lg transition-colors'
                      }
                    >
                      {isSubmitting ? <Loader /> : '🚨 Call Liar!'}
                    </button>
                  )}
                </div>

                {!canMakeBid(quantity, faceValue) && currentBid && (
                  <div className="bg-yellow-500/20 border-2 border-yellow-500/50 rounded-lg p-3 text-center text-sm">
                    Bid must be higher than {currentBid.quantity} × {currentBid.faceValue}
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-neutral2 rounded-xl border-2 border-neutral-contrast/10 p-8 flex flex-col items-center space-y-4">
                <Loader />
                <p className="text-neutral-contrast/70 text-center">
                  Waiting for other players...
                </p>
              </div>
            )}

            {biddingHistory.length > 0 && (
              <div className="bg-neutral2 rounded-xl border-2 border-neutral-contrast/10 p-6">
                <h3 className="text-xl font-primary font-bold text-primary mb-4">Bidding History</h3>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {[...biddingHistory].reverse().slice(0, 5).map((bid, i) => (
                    <div key={i} className="bg-neutral3 p-3 rounded-lg border-2 border-neutral-contrast/10 flex justify-between items-center text-sm">
                      <span className="font-medium">{bid.playerName}</span>
                      <span className="font-bold text-primary">
                        {bid.quantity} × {getDieFaceIcon(bid.faceValue)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {phase === 'playing' && isEliminated && (
          <div className="bg-neutral2 rounded-xl border-2 border-red-500/30 p-8 flex flex-col items-center space-y-4">
            <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center border-2 border-red-500/30">
              <span className="text-5xl">💀</span>
            </div>
            <h2 className="text-2xl font-primary font-bold text-red-400">You're Out!</h2>
            <p className="text-neutral-contrast/70 text-center">
              You've been eliminated. Watch the remaining players battle it out!
            </p>
            <Loader />
          </div>
        )}

        {phase === 'revealing' && roundResult && (
          <div className="space-y-6">
            <div className="bg-neutral2 rounded-xl border-2 border-neutral-contrast/10 p-8 text-center">
              <h1 className="text-3xl font-primary font-bold text-primary mb-4">Challenge!</h1>
              <p className="text-lg text-neutral-contrast/70">
                <span className="font-bold">{roundResult.challengerName}</span> called liar!
              </p>
            </div>

            <div className="bg-gradient-to-r from-primary/20 to-accent/20 rounded-xl border-2 border-primary/40 p-6 text-center">
              <h2 className="text-xl font-primary font-bold mb-3">The Bid</h2>
              <div className="text-5xl font-bold text-primary mb-3">
                {roundResult.bid.quantity} × {getDieFaceIcon(roundResult.bid.faceValue)}
              </div>
              <div className="text-2xl font-bold mb-2">
                Actual: <span className="text-primary">{roundResult.actualCount}</span>
              </div>
              <div className={`text-xl font-bold ${roundResult.wasCorrect ? 'text-green-500' : 'text-red-500'}`}>
                {roundResult.wasCorrect ? 'Bid was TRUE!' : 'Bid was FALSE!'}
              </div>
            </div>

            {myDice && myDice.dice && myDice.dice.length > 0 && (
              <div className="bg-neutral2 rounded-xl border-2 border-neutral-contrast/10 p-6">
                <h2 className="text-xl font-primary font-bold text-primary mb-4 text-center">
                  Your Dice
                </h2>
                <DiceDisplay dice={myDice.dice} />
              </div>
            )}

            <div className={`rounded-xl border-2 p-6 text-center ${
              roundResult.loser === playerId
                ? 'bg-red-500/20 border-red-500/50'
                : 'bg-neutral2 border-neutral-contrast/10'
            }`}>
              <h2 className="text-2xl font-bold mb-2">
                {roundResult.loserName} loses a die! 🎲
              </h2>
              {roundResult.loser === playerId && (
                <p className="text-red-400 font-bold">That's you!</p>
              )}
            </div>

            <div className="bg-neutral2 rounded-xl border-2 border-neutral-contrast/10 p-8 flex flex-col items-center space-y-4">
              <Loader />
              <p className="text-neutral-contrast/70 text-center">
                Waiting for host to start next round...
              </p>
            </div>
          </div>
        )}

        {phase === 'gameOver' && winner && (
          <div className="space-y-6">
            <div className={`rounded-xl border-2 p-12 text-center ${
              winner.playerId === playerId
                ? 'bg-gradient-to-r from-primary/30 to-accent/30 border-primary/50'
                : 'bg-neutral2 border-neutral-contrast/10'
            }`}>
              <h1 className="text-5xl font-primary font-bold text-primary mb-4">
                🏆 Game Over! 🏆
              </h1>
              <h2 className="text-3xl font-bold mb-2">{winner.playerName} Wins!</h2>
              {winner.playerId === playerId && (
                <p className="text-2xl text-primary mt-4">You are the champion!</p>
              )}
            </div>

            <div className="bg-neutral2 rounded-xl border-2 border-neutral-contrast/10 p-6">
              <h2 className="text-2xl font-primary font-bold text-primary mb-4 text-center">
                Final Standings
              </h2>
              <div className="space-y-3">
                {playerDice
                  .sort((a, b) => b.diceCount - a.diceCount)
                  .map((pd, i) => {
                    const isMe = pd.playerId === playerId;
                    return (
                      <div 
                        key={pd.playerId}
                        className={`p-4 rounded-lg border-2 flex justify-between items-center ${
                          isMe 
                            ? 'bg-primary/20 border-primary/30' 
                            : 'bg-neutral3 border-neutral-contrast/10'
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${
                            isMe ? 'bg-primary/30 border-primary/50' : 'bg-primary/20 border-primary/30'
                          }`}>
                            <span className="text-primary font-bold">{i + 1}</span>
                          </div>
                          <span className="font-medium text-lg">
                            {pd.playerName} {isMe && '(You)'} {i === 0 && '👑'}
                          </span>
                        </div>
                        <span className="text-2xl font-bold text-primary">
                          {pd.diceCount}
                        </span>
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default LiarsDicePlayerUI;