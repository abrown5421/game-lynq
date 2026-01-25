import { motion } from 'framer-motion';
import { useEffect, useState, useRef } from 'react';
import { IpodWarGameData } from './types';
import { processSubmissions } from './utils';
import { useGameActionMutation, useGetSessionByIdQuery } from '../../app/store/api/sessionsApi';
import { ISession } from '../../types/session.types';
import Loader from '../loader/Loader';
import { CheckIcon, XMarkIcon } from '@heroicons/react/24/solid';

interface Props {
  session: ISession;
}

const IpodWarGameUI = ({ session }: Props) => {
  const [gameAction] = useGameActionMutation();
  const submissionAudio = new Audio("/assets/audio/ding.mp3");
  const prevSubmissionCountRef = useRef(0);
  const { refetch } = useGetSessionByIdQuery(session._id, { 
    pollingInterval: 1000 
  });
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const hasEndedRef = useRef<boolean>(false);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [isProcessing, setIsProcessing] = useState(false);

  if (!session.gameState?.data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader />
      </div>
    );
  }

  const gameData = session.gameState.data as IpodWarGameData;
  const scores = session.gameState.scores || {};
  const { currentTrack, phase, round, tracks, settings, submissions, roundStartTime } = gameData;

  useEffect(() => {
    if (phase !== 'playing') return;
    
    const currentCount = submissions.length;
    const prevCount = prevSubmissionCountRef.current;

    if (currentCount > prevCount) {
        submissionAudio.play().catch(err => console.warn("Failed to play submission audio:", err));
    }

    prevSubmissionCountRef.current = currentCount;
    }, [submissions, phase]);

  useEffect(() => {
    if (phase === 'playing') {
      hasEndedRef.current = false;
    }
  }, [phase]);

  useEffect(() => {
    if (phase !== 'playing' || !roundStartTime) {
      setTimeLeft(0);
      return;
    }

    const interval = setInterval(() => {
      const elapsed = Date.now() - roundStartTime;
      const remaining = Math.max(0, settings.roundDuration - Math.floor(elapsed / 1000));
      setTimeLeft(remaining);

      if (remaining === 0 && !hasEndedRef.current) {
        hasEndedRef.current = true;
        handleRoundEnd();
      }
    }, 100);

    return () => clearInterval(interval);
  }, [phase, roundStartTime, settings.roundDuration]);

  useEffect(() => {
    if (phase === 'playing' && currentTrack?.previewUrl) {
      if (audioRef.current) {
        audioRef.current.src = currentTrack.previewUrl;
        audioRef.current.loop = true;
        audioRef.current.play().catch(err => console.error('Audio play error:', err));
      }
    } else {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, [phase, currentTrack]);

  const handleRoundEnd = async () => {
  if (isProcessing || !currentTrack) return;
  setIsProcessing(true);

  try {
    const freshSession = await refetch().unwrap();
    const freshGameData = freshSession.gameState?.data as IpodWarGameData;
    const latestSubmissions = freshGameData.submissions || [];
    
    if (latestSubmissions.length === 0) {
      console.warn('No submissions found after refetch!');
    }
    
    const processedSubmissions = processSubmissions(
      latestSubmissions,
      currentTrack.name,
      currentTrack.artist
    );

    const currentScores = freshSession.gameState?.scores || {};
    const newScores = { ...currentScores };
    processedSubmissions.forEach(sub => {
      newScores[sub.playerId] = (newScores[sub.playerId] || 0) + (sub.points || 0);
    });

    await gameAction({
      sessionId: session._id,
      action: 'updateData',
      payload: {
        data: {
          phase: 'revealing',
          revealedAnswer: {
            track: currentTrack,
            submissions: processedSubmissions,
          },
        },
        scores: newScores,
      },
    }).unwrap();
    
  } catch (err) {
    console.error('Failed to end round:', err);
  } finally {
    setIsProcessing(false);
  }
};

  const handleNextRound = async () => {
    if (isProcessing) return;
    setIsProcessing(true);

    try {
      const nextRound = round + 1;

      if (nextRound >= tracks.length) {
        return;
      }

      const nextTrack = tracks[nextRound];

      await gameAction({
        sessionId: session._id,
        action: 'updateData',
        payload: {
            data: {
                round: nextRound,
                currentTrack: nextTrack,
                phase: 'playing',
                revealedAnswer: null,
                submissions: [],
                roundStartTime: Date.now(),
            },
        },
      });
    } catch (err) {
      console.error('Failed to start next round:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  if (!currentTrack && phase !== 'revealing') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      className="bg-neutral text-neutral-contrast min-h-screen p-6"
    >
      <audio ref={audioRef} />

      {phase === 'playing' && (
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-2">Round {round + 1} of {tracks.length}</h1>
            <p className="text-xl opacity-70">Listen and guess!</p>
          </div>

          <div className="bg-accent/20 rounded-lg p-12 text-center mb-8">
            <div className="text-9xl font-bold mb-4">{timeLeft}</div>
            <div className="text-2xl opacity-70">seconds remaining</div>
          </div>

          <div className="bg-accent/10 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">
              Submissions ({submissions.length}/{session.players.length})
            </h2>
            <div className="space-y-2">
              {submissions.map((sub, i) => (
                <div key={i} className="bg-accent/20 p-3 rounded flex justify-between items-center">
                  <span className="font-medium">{sub.playerName}</span>
                  <span className="text-sm opacity-70">✓ Submitted</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {phase === 'revealing' && gameData.revealedAnswer && (
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8 flex justify-between">
            <h1 className="text-4xl font-bold mb-4">Round {round + 1} Results</h1>
            
            <button
                onClick={handleNextRound}
                disabled={isProcessing}
                className="btn-primary w-fit"
            >
                {isProcessing ? <Loader /> : round + 1 >= tracks.length ? 'End Game' : 'Next Round'}
            </button>
          </div>

          <div className="bg-accent/20 rounded-lg p-8 mb-8 flex flex-col md:flex-row items-center gap-8">
            <img
              src={gameData.revealedAnswer.track.artwork}
              alt="Album artwork"
              className="w-48 h-48 rounded-lg shadow-lg"
            />
            <div className="flex-1 text-center md:text-left">
              <h2 className="text-3xl font-bold mb-2">{gameData.revealedAnswer.track.name}</h2>
              <p className="text-2xl opacity-70">{gameData.revealedAnswer.track.artist}</p>
            </div>
          </div>

          <div className="bg-accent/10 rounded-lg p-6 mb-8">
            <h2 className="text-2xl font-semibold mb-4">Player Results</h2>
            <div className="space-y-3">
              {[...gameData.revealedAnswer.submissions]
                .sort((a, b) => (b.points || 0) - (a.points || 0))
                .map((sub, i) => (
                  <div key={i} className="bg-accent/20 p-4 rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <span className="font-bold text-lg">{sub.playerName}</span>
                        <div className="text-sm opacity-70 mt-1 flex">
                          Track: {sub.trackGuess} {sub.trackCorrect ? <CheckIcon className='h-5 w-5 text-green-500 ml-2'/> : <XMarkIcon className='h-5 w-5 text-red-500 ml-2' />}
                        </div>
                        <div className="text-sm opacity-70 flex">
                          Artist: {sub.artistGuess} {sub.artistCorrect ? <CheckIcon className='h-5 w-5 text-green-500 ml-2'/> : <XMarkIcon className='h-5 w-5 text-red-500 ml-2' />}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-primary">+{sub.points}</div>
                        <div className="text-sm opacity-70">points</div>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>

          <div className="bg-accent/10 rounded-lg p-6 mb-8">
            <h2 className="text-2xl font-semibold mb-4">Current Standings</h2>
            <div className="space-y-2">
              {Object.entries(scores)
                .sort(([, a], [, b]) => (b as number) - (a as number))
                .map(([playerId, score], i) => {
                  const player = session.players.find(p => p.userId === playerId || p.unId === playerId);
                  return (
                    <div key={playerId} className="bg-accent/20 p-3 rounded flex justify-between items-center">
                      <span className="font-medium">
                        {i + 1}. {player?.name || 'Unknown'}
                      </span>
                      <span className="text-xl font-bold">{score}</span>
                    </div>
                  );
                })}
            </div>
          </div>

        </div>
      )}
    </motion.div>
  );
};

export default IpodWarGameUI;