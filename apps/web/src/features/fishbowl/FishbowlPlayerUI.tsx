import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useGameActionMutation, useGetSessionByIdQuery } from '../../app/store/api/sessionsApi';
import Loader from '../../features/loader/Loader';
import { ISession } from '../../types/session.types';
import { FishbowlGameData } from './types';
import { getRoundName, getRoundDescription } from './utils';
import { CheckIcon } from '@heroicons/react/24/solid';

interface Props {
  session: ISession;
}

const FishbowlPlayerUI = ({ session }: Props) => {
  const { playerId } = useParams<{ playerId: string }>();
  const [gameAction] = useGameActionMutation();
  const { refetch } = useGetSessionByIdQuery(session._id, { pollingInterval: 1000 });
  
  const [words, setWords] = useState<string[]>([]);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [isProcessing, setIsProcessing] = useState(false);

  if (!session.gameState?.data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral">
        <Loader />
      </div>
    );
  }

  const gameData = session.gameState.data as FishbowlGameData;
  const { phase, teams, currentTeam, currentPlayer, scores, wordsSubmitted, settings, currentWord, turnStartTime, currentRound, remainingWords } = gameData;

  const player = session.players.find(p => p.userId === playerId || p.unId === playerId);
  const playerName = player?.name || 'Unknown';
  const playerTeam = teams.team1.players.includes(playerId || '') ? 'team1' : teams.team2.players.includes(playerId || '') ? 'team2' : null;
  const isMyTurn = currentPlayer === playerId;

  useEffect(() => {
    if (settings?.wordsPerPlayer) {
      setWords(new Array(settings.wordsPerPlayer).fill(''));
    }
  }, [settings?.wordsPerPlayer]);

  useEffect(() => {
    if (phase === 'playing' && turnStartTime) {
      const interval = setInterval(() => {
        const elapsed = Date.now() - turnStartTime;
        const remaining = Math.max(0, (settings?.turnDuration || 60) - Math.floor(elapsed / 1000));
        setTimeLeft(remaining);
      }, 100);

      return () => clearInterval(interval);
    }
  }, [phase, turnStartTime, settings?.turnDuration]);

  const handleWordChange = (index: number, value: string) => {
    const newWords = [...words];
    newWords[index] = value;
    setWords(newWords);
  };

  const handleSubmitWords = async () => {
    if (!playerId) return;
    
    const validWords = words.filter(w => w.trim().length > 0);
    if (validWords.length < (settings?.wordsPerPlayer || 3)) {
      alert(`Please enter all ${settings?.wordsPerPlayer || 3} words`);
      return;
    }

    setIsSubmitting(true);

    try {
      const freshSession = await refetch().unwrap();
      const freshData = freshSession.gameState?.data as FishbowlGameData;
      
      const updatedSubmitted = { ...freshData.wordsSubmitted };
      updatedSubmitted[playerId] = validWords;

      const newFishbowl = [...freshData.fishbowl];
      validWords.forEach(word => {
        newFishbowl.push({
          text: word,
          submittedBy: playerId,
        });
      });

      await gameAction({
        sessionId: session._id,
        action: 'updateData',
        payload: {
          data: {
            wordsSubmitted: updatedSubmitted,
            fishbowl: newFishbowl,
          },
        },
      }).unwrap();
    } catch (err) {
      console.error('Failed to submit words:', err);
      alert('Failed to submit words. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCorrectGuess = async () => {
    if (isProcessing || !currentWord || !playerId) return;
    setIsProcessing(true);

    try {
      const freshSession = await refetch().unwrap();
      const freshData = freshSession.gameState?.data as FishbowlGameData;
      
      const updatedRemaining = freshData.remainingWords.filter(w => w.text !== currentWord.text);
      const updatedGuessed = [...freshData.wordsGuessedThisTurn, currentWord];
      const newScores = { ...freshData.scores };
      newScores[currentTeam] = (newScores[currentTeam] || 0) + 1;

      const nextWord = updatedRemaining[0] || null;

      await gameAction({
        sessionId: session._id,
        action: 'updateData',
        payload: {
          data: {
            remainingWords: updatedRemaining,
            currentWord: nextWord,
            wordsGuessedThisTurn: updatedGuessed,
            scores: newScores,
          },
        },
      }).unwrap();
    } catch (err) {
      console.error('Failed to mark correct:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSkip = async () => {
    if (isProcessing || !currentWord || !settings?.allowSkips || !playerId) return;
    setIsProcessing(true);

    try {
      const freshSession = await refetch().unwrap();
      const freshData = freshSession.gameState?.data as FishbowlGameData;
      
      const updatedRemaining = freshData.remainingWords.filter(w => w.text !== currentWord.text);
      updatedRemaining.push(currentWord);
      
      const updatedSkipped = [...freshData.wordsSkippedThisTurn, currentWord];
      const nextWord = updatedRemaining[0] || null;

      await gameAction({
        sessionId: session._id,
        action: 'updateData',
        payload: {
          data: {
            remainingWords: updatedRemaining,
            currentWord: nextWord,
            wordsSkippedThisTurn: updatedSkipped,
          },
        },
      }).unwrap();
    } catch (err) {
      console.error('Failed to skip:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const getPlayerName = (pId: string) => {
    const p = session.players.find(pl => pl.userId === pId || pl.unId === pId);
    return p?.name || 'Unknown';
  };

  if (phase === 'word-submission') {
    const playerWordsSubmitted = (wordsSubmitted && playerId && wordsSubmitted[playerId]) ? wordsSubmitted[playerId] : [];
    const hasSubmitted = playerWordsSubmitted.length >= (settings?.wordsPerPlayer || 3);

    if (hasSubmitted) {
      return (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-neutral text-neutral-contrast min-h-screen p-6 flex items-center justify-center"
        >
          <div className="flex flex-col items-center max-w-lg w-full bg-neutral2 rounded-xl border-2 border-green-500/30 p-8 text-center space-y-6">
            <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center border-2 border-green-500/30 mx-auto">
              <CheckIcon className="h-15 w-15 text-green-500" />
            </div>
            <h2 className="text-3xl font-primary font-bold text-green-400">Words Submitted!</h2>
            <p className="text-neutral-contrast/70">
              Waiting for other players to submit their words...
            </p>
            <Loader />
          </div>
        </motion.div>
      );
    }

    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-neutral text-neutral-contrast min-h-screen p-6"
      >
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="bg-neutral2 rounded-xl border-2 border-neutral-contrast/10 p-8 text-center">
            <h1 className="text-4xl font-primary font-bold text-primary mb-2">
              Submit Your Words
            </h1>
            <p className="text-neutral-contrast/70">
              Enter {settings?.wordsPerPlayer || 3} words or phrases for the fishbowl
            </p>
          </div>

          <div className="bg-neutral2 rounded-xl border-2 border-neutral-contrast/10 p-6 space-y-4">
            {words.map((word, index) => (
              <div key={index}>
                <label className="block text-sm font-medium mb-2 text-neutral-contrast/70">
                  Word {index + 1}
                </label>
                <input
                  type="text"
                  value={word}
                  onChange={(e) => handleWordChange(index, e.target.value)}
                  placeholder="Enter a word or phrase..."
                  className="input-primary w-full"
                  disabled={isSubmitting}
                />
              </div>
            ))}
          </div>

          <button
            onClick={handleSubmitWords}
            disabled={isSubmitting || words.filter(w => w.trim()).length < (settings?.wordsPerPlayer || 3)}
            className={
              isSubmitting || words.filter(w => w.trim()).length < (settings?.wordsPerPlayer || 3)
                ? 'btn-disabled w-full'
                : 'btn-primary w-full'
            }
          >
            {isSubmitting ? <Loader /> : 'Submit Words'}
          </button>
        </div>
      </motion.div>
    );
  }

  if (phase === 'team-assignment') {
    const myTeamColor = playerTeam === 'team1' ? 'blue' : 'red';
    const myTeam = playerTeam ? teams[playerTeam] : null;
    const otherTeam = playerTeam === 'team1' ? teams.team2 : teams.team1;

    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="bg-neutral text-neutral-contrast min-h-screen p-6"
      >
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="bg-neutral2 rounded-xl border-2 border-neutral-contrast/10 p-8 text-center">
            <h1 className="text-4xl font-primary font-bold text-primary mb-2">
              You're on {myTeam?.name}!
            </h1>
            <p className="text-neutral-contrast/70">
              Work together to guess the most words
            </p>
          </div>

          <div className={`bg-neutral2 rounded-xl border-2 border-${myTeamColor}-500/30 p-6`}>
            <h2 className={`text-3xl font-primary font-bold text-${myTeamColor}-400 mb-4 text-center`}>
              {myTeam?.name}
            </h2>
            <div className="space-y-3">
              {myTeam?.players.map((pId, i) => (
                <div key={pId} className={`bg-neutral3 p-4 rounded-lg flex items-center space-x-3 ${pId === playerId ? 'border-2 border-primary' : ''}`}>
                  <div className={`w-10 h-10 bg-${myTeamColor}-500/20 rounded-full flex items-center justify-center border-2 border-${myTeamColor}-500/30`}>
                    <span className={`text-${myTeamColor}-400 font-bold`}>{i + 1}</span>
                  </div>
                  <span className="text-lg font-medium">
                    {getPlayerName(pId)} {pId === playerId && '(You)'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-neutral2 rounded-xl border-2 border-neutral-contrast/10 p-6">
            <h3 className="text-xl font-bold text-neutral-contrast/70 mb-4 text-center">
              Other Team
            </h3>
            <div className="space-y-2">
              {otherTeam.players.map((pId) => (
                <div key={pId} className="bg-neutral3 p-3 rounded-lg text-center">
                  <span className="text-neutral-contrast/70">{getPlayerName(pId)}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-neutral2 rounded-xl border-2 border-neutral-contrast/10 p-6 text-center flex flex-col items-center">
            <Loader />
            <p className="text-neutral-contrast/70 mt-4">
              Waiting for host to start the game...
            </p>
          </div>
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
        <div className="max-w-2xl w-full bg-neutral2 rounded-xl border-2 border-primary/30 p-12 text-center space-y-6 flex flex-col items-center">
          <h1 className="text-6xl font-primary font-bold text-primary">
            Round {currentRound + 1}
          </h1>
          <h2 className="text-4xl font-bold text-neutral-contrast">
            {getRoundName(currentRound)}
          </h2>
          <p className="text-2xl text-neutral-contrast/70">
            {getRoundDescription(currentRound)}
          </p>
          <Loader />
        </div>
      </motion.div>
    );
  }

  if (phase === 'playing') {
    const myTeamColor = playerTeam === 'team1' ? 'blue' : 'red';
    const isMyTeamsTurn = currentTeam === playerTeam;

    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="bg-neutral text-neutral-contrast min-h-screen p-6"
      >
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="bg-neutral2 rounded-xl border-2 border-neutral-contrast/10 p-6">
            <div className="flex justify-between items-center">
              <div>
                <div className="text-sm text-neutral-contrast/70">Your Team</div>
                <div className={`text-2xl font-bold text-${myTeamColor}-400`}>
                  {playerTeam ? teams[playerTeam].name : 'Unknown'}
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm text-neutral-contrast/70">Score</div>
                <div className="text-3xl font-bold text-primary">
                  {playerTeam ? scores[playerTeam] : 0}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-neutral2 rounded-xl border-2 border-neutral-contrast/10 p-6 text-center">
            <div className="text-sm text-neutral-contrast/70 mb-2">Round {currentRound + 1}</div>
            <div className="text-2xl font-bold text-primary mb-4">{getRoundName(currentRound)}</div>
            <div className="text-6xl font-bold text-primary mb-2">{timeLeft}s</div>
            <div className="text-sm text-neutral-contrast/70">
              {remainingWords.length} words remaining
            </div>
          </div>

          {isMyTurn ? (
            <div className="bg-neutral2 rounded-xl border-2 border-primary/30 p-8 space-y-6">
              <div className="text-center">
                <h2 className="text-3xl font-primary font-bold text-primary mb-4">
                  Your Turn!
                </h2>
                <p className="text-neutral-contrast/70 mb-6">
                  Give clues to help your team guess the word
                </p>
              </div>

              <div className="bg-primary/10 rounded-xl p-8 border-2 border-primary/30 text-center">
                <div className="text-5xl font-bold text-primary mb-2">
                  {currentWord?.text || 'Loading...'}
                </div>
              </div>

              <div className={`grid gap-4 ${settings?.allowSkips ? "grid-cols-2" : "grid-cols-1"}`}>
                {settings?.allowSkips && (
                    <button
                    onClick={handleSkip}
                    disabled={isProcessing || !currentWord}
                    className={isProcessing || !currentWord ? "btn-disabled" : "btn-gray"}
                    >
                    Skip
                    </button>
                )}

                <button
                    onClick={handleCorrectGuess}
                    disabled={isProcessing || !currentWord}
                    className={isProcessing || !currentWord ? "btn-disabled" : "btn-primary"}
                >
                    Correct
                </button>
              </div>
              <div className="bg-neutral3 rounded-lg p-4 border-2 border-neutral-contrast/10">
                <p className="text-sm text-neutral-contrast/70 text-center">
                  Mark correct when your team guesses it, or skip to move to the next word
                </p>
              </div>
            </div>
          ) : (
            <div className={`bg-neutral2 rounded-xl border-2 ${
              isMyTeamsTurn ? 'border-green-500/30' : 'border-neutral-contrast/10'
            } p-8 text-center space-y-4`}>
              {isMyTeamsTurn ? (
                <>
                  <h2 className="text-3xl font-primary font-bold text-green-400">
                    Your Team's Turn!
                  </h2>
                  <p className="text-xl text-neutral-contrast">
                    {getPlayerName(currentPlayer || '')} is giving clues
                  </p>
                  <div className="bg-neutral3 rounded-lg p-6 border-2 border-neutral-contrast/10 mt-4">
                    <p className="text-lg text-neutral-contrast/70">
                      Listen carefully and try to guess the word!
                    </p>
                  </div>
                </>
              ) : (
                <div className='flex flex-col justify-center items-center'>
                  <h2 className="text-3xl font-primary font-bold text-neutral-contrast/70">
                    Other Team's Turn
                  </h2>
                  <p className="text-xl text-neutral-contrast/50">
                    {getPlayerName(currentPlayer || '')} is giving clues
                  </p>
                  <div className='my-3'>
                    <Loader />
                  </div>
                  <p className="text-neutral-contrast/50">
                    Wait for your team's turn...
                  </p>
                </div>
              )}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className={`bg-neutral2 rounded-xl border-2 ${
              currentTeam === 'team1' ? 'border-blue-500/50' : 'border-blue-500/20'
            } p-4 text-center`}>
              <div className="text-sm text-neutral-contrast/70">Team 1</div>
              <div className="text-3xl font-bold text-primary">{scores.team1}</div>
            </div>
            <div className={`bg-neutral2 rounded-xl border-2 ${
              currentTeam === 'team2' ? 'border-red-500/50' : 'border-red-500/20'
            } p-4 text-center`}>
              <div className="text-sm text-neutral-contrast/70">Team 2</div>
              <div className="text-3xl font-bold text-primary">{scores.team2}</div>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  if (phase === 'turn-end' || phase === 'round-end') {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="bg-neutral text-neutral-contrast min-h-screen p-6 flex items-center justify-center"
      >
        <div className="max-w-2xl w-full space-y-6">
          <div className="bg-neutral2 rounded-xl border-2 border-neutral-contrast/10 p-8 text-center">
            <h1 className="text-4xl font-primary font-bold text-primary mb-4">
              {phase === 'turn-end' ? 'Turn Complete!' : 'Round Complete!'}
            </h1>
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

          <div className="bg-neutral2 rounded-xl border-2 border-neutral-contrast/10 p-6 text-center flex flex-col justify-center items-center">
            <Loader />
            <p className="text-neutral-contrast/70 mt-4">
              Waiting for host to continue...
            </p>
          </div>
        </div>
      </motion.div>
    );
  }

  if (phase === 'finished') {
    const winner = scores.team1 > scores.team2 ? teams.team1 : scores.team2 > scores.team1 ? teams.team2 : null;
    const myTeamWon = winner && playerTeam && winner.name === teams[playerTeam].name;

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-neutral text-neutral-contrast min-h-screen p-6 flex items-center justify-center"
      >
        <div className="max-w-2xl w-full space-y-6">
          <div className={`bg-neutral2 rounded-xl border-2 ${
            myTeamWon ? 'border-green-500/30' : 'border-neutral-contrast/10'
          } p-12 text-center`}>
            <h1 className="text-6xl font-primary font-bold text-primary mb-4">
              Game Over!
            </h1>
            {winner ? (
              myTeamWon ? (
                <p className="text-4xl text-green-400 font-bold">
                  Your Team Wins!
                </p>
              ) : (
                <p className="text-3xl text-neutral-contrast">
                  {winner.name} Wins!
                </p>
              )
            ) : (
              <p className="text-3xl text-neutral-contrast">
                It's a Tie!
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="bg-neutral2 rounded-xl border-2 border-blue-500/30 p-6 text-center">
              <h3 className="text-2xl font-bold text-blue-400 mb-2">{teams.team1.name}</h3>
              <div className="text-6xl font-bold text-primary">{scores.team1}</div>
            </div>
            <div className="bg-neutral2 rounded-xl border-2 border-red-500/30 p-6 text-center">
              <h3 className="text-2xl font-bold text-red-400 mb-2">{teams.team2.name}</h3>
              <div className="text-6xl font-bold text-primary">{scores.team2}</div>
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

export default FishbowlPlayerUI;