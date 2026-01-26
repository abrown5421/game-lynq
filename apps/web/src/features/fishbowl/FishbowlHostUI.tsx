import { motion } from 'framer-motion';
import { useEffect, useState, useRef } from 'react';
import { useGameActionMutation, useGetSessionByIdQuery } from '../../app/store/api/sessionsApi';
import { ISession } from '../../types/session.types';
import Loader from '../../features/loader/Loader';
import { FishbowlGameData } from './types';
import { assignTeams, getNextPlayer, getNextTeam, getRoundName, getRoundDescription } from './utils';

interface Props {
  session: ISession;
}

const FishbowlHostUI = ({ session }: Props) => {
  const [gameAction] = useGameActionMutation();
  const { refetch } = useGetSessionByIdQuery(session._id, { pollingInterval: 1000 });
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const timerEndedRef = useRef(false);

  if (!session.gameState?.data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral">
        <Loader />
      </div>
    );
  }

  const gameData = session.gameState.data as FishbowlGameData;
  const { phase, teams, currentTeam, currentPlayer, turnStartTime, scores, wordsGuessedThisTurn, currentWord, remainingWords, currentRound, settings, wordsSubmitted } = gameData;

  useEffect(() => {
    if (phase === 'playing' && turnStartTime) {
      timerEndedRef.current = false;
      
      const interval = setInterval(() => {
        const elapsed = Date.now() - turnStartTime;
        const remaining = Math.max(0, (settings?.turnDuration || 60) - Math.floor(elapsed / 1000));
        setTimeLeft(remaining);

        if (remaining === 0 && !timerEndedRef.current) {
          timerEndedRef.current = true;
          handleTurnEnd();
        }
      }, 100);

      return () => clearInterval(interval);
    }
  }, [phase, turnStartTime, settings?.turnDuration]);

  // Auto-end turn when no words remaining
  useEffect(() => {
    if (phase === 'playing' && remainingWords.length === 0 && !timerEndedRef.current) {
      timerEndedRef.current = true;
      handleTurnEnd();
    }
  }, [phase, remainingWords.length]);

  const handleAssignTeams = async () => {
    if (isProcessing) return;
    setIsProcessing(true);

    try {
      const playerIds = session.players.map(p => p.userId || p.unId || '');
      const { team1, team2 } = assignTeams(playerIds);

      await gameAction({
        sessionId: session._id,
        action: 'updateData',
        payload: {
          data: {
            phase: 'team-assignment',
            teams: {
              team1: { name: 'Team 1', players: team1 },
              team2: { name: 'Team 2', players: team2 },
            },
          },
        },
      }).unwrap();
    } catch (err) {
      console.error('Failed to assign teams:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleStartRound = async () => {
    if (isProcessing) return;
    setIsProcessing(true);

    try {
      const freshSession = await refetch().unwrap();
      const freshData = freshSession.gameState?.data as FishbowlGameData;
      
      const wordsForRound = currentRound === 0 ? freshData.fishbowl : freshData.fishbowl;
      const { team, player } = getNextPlayer('team1', freshData.teams, null);

      await gameAction({
        sessionId: session._id,
        action: 'updateData',
        payload: {
          data: {
            phase: 'round-intro',
            remainingWords: wordsForRound,
            currentTeam: team,
            currentPlayer: player,
          },
        },
      }).unwrap();

      setTimeout(async () => {
        await gameAction({
          sessionId: session._id,
          action: 'updateData',
          payload: {
            data: {
              phase: 'playing',
              turnStartTime: Date.now(),
              currentWord: wordsForRound[0] || null,
            },
          },
        }).unwrap();
      }, 5000);
    } catch (err) {
      console.error('Failed to start round:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleTurnEnd = async () => {
    if (isProcessing) return;
    setIsProcessing(true);

    try {
      await gameAction({
        sessionId: session._id,
        action: 'updateData',
        payload: {
          data: {
            phase: 'turn-end',
            turnStartTime: null,
          },
        },
      }).unwrap();
    } catch (err) {
      console.error('Failed to end turn:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleNextTurn = async () => {
    if (isProcessing) return;
    setIsProcessing(true);

    try {
      const freshSession = await refetch().unwrap();
      const freshData = freshSession.gameState?.data as FishbowlGameData;

      if (freshData.remainingWords.length === 0) {
        const nextRound = currentRound + 1;
        
        if (nextRound >= 3) {
          await gameAction({
            sessionId: session._id,
            action: 'updateData',
            payload: {
              data: {
                phase: 'finished',
              },
            },
          }).unwrap();
        } else {
          await gameAction({
            sessionId: session._id,
            action: 'updateData',
            payload: {
              data: {
                phase: 'round-end',
                currentRound: nextRound,
              },
            },
          }).unwrap();
        }
      } else {
        const nextTeam = getNextTeam(currentTeam);
        const { team, player } = getNextPlayer(nextTeam, freshData.teams, freshData.currentPlayer);

        await gameAction({
          sessionId: session._id,
          action: 'updateData',
          payload: {
            data: {
              phase: 'playing',
              currentTeam: team,
              currentPlayer: player,
              turnStartTime: Date.now(),
              wordsGuessedThisTurn: [],
              wordsSkippedThisTurn: [],
              currentWord: freshData.remainingWords[0] || null,
            },
          },
        }).unwrap();
      }
    } catch (err) {
      console.error('Failed to start next turn:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const getPlayerName = (playerId: string) => {
    const player = session.players.find(p => p.userId === playerId || p.unId === playerId);
    return player?.name || 'Unknown';
  };

  if (phase === 'word-submission') {
    const totalWords = session.players.length * (settings?.wordsPerPlayer || 3);
    const submittedWords = Object.values(wordsSubmitted || {}).flat().length;
    const allSubmitted = submittedWords >= totalWords;

    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-neutral text-neutral-contrast min-h-screen p-6"
      >
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="bg-neutral2 rounded-xl border-2 border-neutral-contrast/10 p-8 text-center">
            <h1 className="text-4xl font-primary font-bold text-primary mb-2">
              Word Submission
            </h1>
            <p className="text-neutral-contrast/70">
              Waiting for players to submit their words...
            </p>
          </div>

          <div className="bg-neutral2 rounded-xl border-2 border-neutral-contrast/10 p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-primary font-bold text-primary">Progress</h2>
              <div className="bg-accent/20 rounded-lg px-4 py-2 border-2 border-accent/30">
                <span className="text-xl font-bold text-primary">
                  {submittedWords}/{totalWords}
                </span>
              </div>
            </div>
            
            <div className="w-full bg-neutral3 rounded-full h-4 border-2 border-neutral-contrast/10">
              <div
                className="bg-primary h-full rounded-full transition-all duration-500"
                style={{ width: `${(submittedWords / totalWords) * 100}%` }}
              />
            </div>

            <div className="mt-6 space-y-2">
              {session.players.map(player => {
                const playerId = player.userId || player.unId || '';
                const submitted = (wordsSubmitted && wordsSubmitted[playerId]) ? wordsSubmitted[playerId].length : 0;
                const required = settings?.wordsPerPlayer || 3;
                const complete = submitted >= required;

                return (
                  <div key={playerId} className="flex justify-between items-center p-3 bg-neutral3 rounded-lg">
                    <span className="font-medium">{player.name}</span>
                    <span className={`${complete ? 'text-green-500' : 'text-neutral-contrast/50'}`}>
                      {submitted}/{required} words
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {allSubmitted && (
            <button
              onClick={handleAssignTeams}
              disabled={isProcessing}
              className={isProcessing ? 'btn-disabled w-full' : 'btn-primary w-full'}
            >
              {isProcessing ? <Loader /> : 'Assign Teams'}
            </button>
          )}
        </div>
      </motion.div>
    );
  }

  if (phase === 'team-assignment') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-neutral text-neutral-contrast min-h-screen p-6"
      >
        <div className="max-w-5xl mx-auto space-y-6">
          <div className="bg-neutral2 rounded-xl border-2 border-neutral-contrast/10 p-8 text-center">
            <h1 className="text-4xl font-primary font-bold text-primary mb-2">
              Teams Assigned!
            </h1>
            <p className="text-neutral-contrast/70">
              Players have been divided into two teams
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-neutral2 rounded-xl border-2 border-blue-500/30 p-6">
              <h2 className="text-3xl font-primary font-bold text-blue-400 mb-4 text-center">
                {teams.team1.name}
              </h2>
              <div className="space-y-3">
                {teams.team1.players.map((playerId, i) => (
                  <div key={playerId} className="bg-neutral3 p-4 rounded-lg flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-500/20 rounded-full flex items-center justify-center border-2 border-blue-500/30">
                      <span className="text-blue-400 font-bold">{i + 1}</span>
                    </div>
                    <span className="text-lg font-medium">{getPlayerName(playerId)}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-neutral2 rounded-xl border-2 border-red-500/30 p-6">
              <h2 className="text-3xl font-primary font-bold text-red-400 mb-4 text-center">
                {teams.team2.name}
              </h2>
              <div className="space-y-3">
                {teams.team2.players.map((playerId, i) => (
                  <div key={playerId} className="bg-neutral3 p-4 rounded-lg flex items-center space-x-3">
                    <div className="w-10 h-10 bg-red-500/20 rounded-full flex items-center justify-center border-2 border-red-500/30">
                      <span className="text-red-400 font-bold">{i + 1}</span>
                    </div>
                    <span className="text-lg font-medium">{getPlayerName(playerId)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <button
            onClick={handleStartRound}
            disabled={isProcessing}
            className={isProcessing ? 'btn-disabled w-full' : 'btn-primary w-full'}
          >
            {isProcessing ? <Loader /> : 'Start Round 1'}
          </button>
        </div>
      </motion.div>
    );
  }

  if (phase === 'round-intro') {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-neutral text-neutral-contrast min-h-screen p-6 flex items-center justify-center"
      >
        <div className="max-w-2xl w-full bg-neutral2 rounded-xl border-2 border-primary/30 p-12 text-center flex flex-col items-center justify-center">
          <h1 className="text-6xl font-primary font-bold text-primary mb-4">
            Round {currentRound + 1}
          </h1>
          <h2 className="text-4xl font-bold text-neutral-contrast mb-6">
            {getRoundName(currentRound)}
          </h2>
          <p className="text-2xl text-neutral-contrast/70 mb-8">
            {getRoundDescription(currentRound)}
          </p>
          <Loader />
          <p className="text-neutral-contrast/50 mt-4">Starting in a moment...</p>
        </div>
      </motion.div>
    );
  }

  if (phase === 'playing') {
    const currentTeamColor = currentTeam === 'team1' ? 'blue' : 'red';

    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="bg-neutral text-neutral-contrast min-h-screen p-6"
      >
        <div className="max-w-5xl mx-auto space-y-6">
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-neutral2 rounded-xl border-2 border-neutral-contrast/10 p-6 text-center">
              <div className="text-sm text-neutral-contrast/70">Round</div>
              <div className="text-3xl font-bold text-primary">{currentRound + 1}/3</div>
              <div className="text-sm text-neutral-contrast/70 mt-1">{getRoundName(currentRound)}</div>
            </div>

            <div className={`bg-neutral2 rounded-xl border-2 border-${currentTeamColor}-500/30 p-6 text-center`}>
              <div className="text-sm text-neutral-contrast/70">Current Player</div>
              <div className={`text-2xl font-bold text-${currentTeamColor}-400`}>
                {currentPlayer ? getPlayerName(currentPlayer) : 'None'}
              </div>
              <div className={`text-sm text-${currentTeamColor}-400/70 mt-1`}>
                {teams[currentTeam].name}
              </div>
            </div>

            <div className="bg-neutral2 rounded-xl border-2 border-primary/30 p-6 text-center">
              <div className="text-sm text-neutral-contrast/70">Time Left</div>
              <div className="text-5xl font-bold text-primary">{timeLeft}</div>
            </div>
          </div>

          

          <div className="grid grid-cols-2 gap-6">
            <div className="bg-neutral2 rounded-xl border-2 border-blue-500/30 p-6">
              <h3 className="text-xl font-bold text-blue-400 mb-2">{teams.team1.name}</h3>
              <div className="text-4xl font-bold text-primary">{scores.team1}</div>
            </div>

            <div className="bg-neutral2 rounded-xl border-2 border-red-500/30 p-6">
              <h3 className="text-xl font-bold text-red-400 mb-2">{teams.team2.name}</h3>
              <div className="text-4xl font-bold text-primary">{scores.team2}</div>
            </div>
          </div>

          <div className="bg-neutral2 rounded-xl border-2 border-neutral-contrast/10 p-4">
            <div className="text-sm text-neutral-contrast/70 mb-2">This Turn:</div>
            {wordsGuessedThisTurn.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {wordsGuessedThisTurn.map((word, i) => (
                  <span key={i} className="bg-green-500/20 text-green-400 px-3 py-1 rounded-lg text-sm border border-green-500/30">
                    {word.text}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-neutral-contrast/50 text-sm">No words guessed yet this turn</p>
            )}
          </div>
        </div>
      </motion.div>
    );
  }

  if (phase === 'turn-end') {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="bg-neutral text-neutral-contrast min-h-screen p-6"
      >
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="bg-neutral2 rounded-xl border-2 border-neutral-contrast/10 p-8 text-center">
            <h1 className="text-4xl font-primary font-bold text-primary mb-2">
              Turn Complete!
            </h1>
            <p className="text-xl text-neutral-contrast/70">
              {getPlayerName(currentPlayer || '')} guessed {wordsGuessedThisTurn.length} word(s)
            </p>
          </div>

          <div className="bg-neutral2 rounded-xl border-2 border-neutral-contrast/10 p-6">
            <h2 className="text-2xl font-primary font-bold text-primary mb-4">Words Guessed</h2>
            {wordsGuessedThisTurn.length > 0 ? (
              <div className="space-y-2">
                {wordsGuessedThisTurn.map((word, i) => (
                  <div key={i} className="bg-green-500/20 border border-green-500/30 p-4 rounded-lg">
                    <span className="text-lg font-medium">{word.text}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-neutral-contrast/50 text-center py-4">No words guessed this turn</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="bg-neutral2 rounded-xl border-2 border-blue-500/30 p-6 text-center">
              <h3 className="text-xl font-bold text-blue-400 mb-2">{teams.team1.name}</h3>
              <div className="text-5xl font-bold text-primary">{scores.team1}</div>
            </div>

            <div className="bg-neutral2 rounded-xl border-2 border-red-500/30 p-6 text-center">
              <h3 className="text-xl font-bold text-red-400 mb-2">{teams.team2.name}</h3>
              <div className="text-5xl font-bold text-primary">{scores.team2}</div>
            </div>
          </div>

          <button
            onClick={handleNextTurn}
            disabled={isProcessing}
            className={isProcessing ? 'btn-disabled w-full' : 'btn-primary w-full'}
          >
            {isProcessing ? <Loader /> : remainingWords.length === 0 ? 'End Round' : 'Next Turn'}
          </button>
        </div>
      </motion.div>
    );
  }

  if (phase === 'round-end') {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="bg-neutral text-neutral-contrast min-h-screen p-6"
      >
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="bg-neutral2 rounded-xl border-2 border-neutral-contrast/10 p-8 text-center">
            <h1 className="text-4xl font-primary font-bold text-primary mb-2">
              Round {currentRound} Complete!
            </h1>
            <p className="text-xl text-neutral-contrast/70">
              Get ready for Round {currentRound + 1}: {getRoundName(currentRound)}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="bg-neutral2 rounded-xl border-2 border-blue-500/30 p-8 text-center">
              <h3 className="text-2xl font-bold text-blue-400 mb-4">{teams.team1.name}</h3>
              <div className="text-6xl font-bold text-primary mb-2">{scores.team1}</div>
              <div className="text-neutral-contrast/70">points</div>
            </div>

            <div className="bg-neutral2 rounded-xl border-2 border-red-500/30 p-8 text-center">
              <h3 className="text-2xl font-bold text-red-400 mb-4">{teams.team2.name}</h3>
              <div className="text-6xl font-bold text-primary mb-2">{scores.team2}</div>
              <div className="text-neutral-contrast/70">points</div>
            </div>
          </div>

          <button
            onClick={handleStartRound}
            disabled={isProcessing}
            className={isProcessing ? 'btn-disabled w-full' : 'btn-primary w-full'}
          >
            {isProcessing ? <Loader /> : `Start Round ${currentRound + 1}`}
          </button>
        </div>
      </motion.div>
    );
  }

  if (phase === 'finished') {
    const winner = scores.team1 > scores.team2 ? teams.team1 : scores.team2 > scores.team1 ? teams.team2 : null;

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-neutral text-neutral-contrast min-h-screen p-6 flex items-center justify-center"
      >
        <div className="max-w-3xl w-full space-y-6">
          <div className="bg-neutral2 rounded-xl border-2 border-primary/30 p-12 text-center">
            <h1 className="text-6xl font-primary font-bold text-primary mb-4">
              Game Over!
            </h1>
            {winner ? (
              <p className="text-3xl text-neutral-contrast">
                {winner.name} Wins!
              </p>
            ) : (
              <p className="text-3xl text-neutral-contrast">
                It's a Tie!
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="bg-neutral2 rounded-xl border-2 border-blue-500/30 p-8 text-center">
              <h3 className="text-2xl font-bold text-blue-400 mb-4">{teams.team1.name}</h3>
              <div className="text-7xl font-bold text-primary mb-4">{scores.team1}</div>
              <div className="space-y-2">
                {teams.team1.players.map(playerId => (
                  <div key={playerId} className="text-neutral-contrast/70">
                    {getPlayerName(playerId)}
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-neutral2 rounded-xl border-2 border-red-500/30 p-8 text-center">
              <h3 className="text-2xl font-bold text-red-400 mb-4">{teams.team2.name}</h3>
              <div className="text-7xl font-bold text-primary mb-4">{scores.team2}</div>
              <div className="space-y-2">
                {teams.team2.players.map(playerId => (
                  <div key={playerId} className="text-neutral-contrast/70">
                    {getPlayerName(playerId)}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral">
      <Loader />
    </div>
  );
};

export default FishbowlHostUI;