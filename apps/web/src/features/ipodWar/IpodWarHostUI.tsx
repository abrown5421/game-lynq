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

const IpodWarHostUI = ({ session }: Props) => {
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
      <div className="min-h-screen flex items-center justify-center bg-neutral">
        <Loader />
      </div>
    );
  }

  const gameData = session.gameState.data as IpodWarGameData;
  const scores = session.gameState.scores || {};
  const { currentTrack, phase, round, tracks, settings = { roundDuration: 30 }, submissions, roundStartTime } = gameData;

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
    if (phase !== 'playing') return;
    if (hasEndedRef.current) return;

    const totalPlayers = session.players.length;
    const submittedPlayers = submissions.length;

    if (submittedPlayers >= totalPlayers && totalPlayers > 0) {
      console.log('All players submitted — ending round early');
      hasEndedRef.current = true;
      handleRoundEnd();
    }
  }, [submissions, phase, session.players.length]);

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
      <div className="min-h-screen flex items-center justify-center bg-neutral">
        <Loader />
      </div>
    );
  }

  function getHighResArtwork(url: string, size = 600) {
    return url.replace(/\/\d+x\d+bb\.jpg$/, `/${size}x${size}bb.jpg`);
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
        <div className="max-w-5xl mx-auto space-y-6">
          <div className="bg-neutral2 rounded-xl border-2 border-neutral-contrast/10 p-8 text-center">
            <h1 className="text-4xl font-primary font-bold text-primary mb-2">
              Round {round + 1} of {tracks.length}
            </h1>
            <p className="text-xl text-neutral-contrast/70">Listen carefully and wait for submissions</p>
          </div>

          <div className="bg-neutral2 rounded-xl border-2 border-primary/30 p-12 text-center">
            <div className="text-9xl font-bold text-primary mb-4">{timeLeft}</div>
            <div className="text-2xl text-neutral-contrast/70">seconds remaining</div>
          </div>

          <div className="bg-neutral2 rounded-xl border-2 border-neutral-contrast/10 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-primary font-bold text-primary">Submissions</h2>
              <div className="bg-accent/20 rounded-lg px-4 py-2 border-2 border-accent/30">
                <span className="text-xl font-bold text-primary">
                  {submissions.length}/{session.players.length}
                </span>
              </div>
            </div>
            
            {submissions.length === 0 ? (
              <div className="text-center py-8 text-neutral-contrast/50">
                Waiting for players to submit their answers...
              </div>
            ) : (
              <div className="space-y-3">
                {submissions.map((sub, i) => (
                  <div key={i} className="bg-neutral3 p-4 rounded-lg border-2 border-neutral-contrast/10 flex justify-between items-center">
                    <span className="font-medium text-lg">{sub.playerName}</span>
                    <span className="text-primary font-bold">Submitted</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {phase === 'revealing' && gameData.revealedAnswer && (
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="bg-neutral2 rounded-xl border-2 border-neutral-contrast/10 p-8 text-center">
            <h1 className="text-4xl font-primary font-bold text-primary mb-4">Round {round + 1} Results</h1>
          </div>

          <div className="bg-neutral2 rounded-xl border-2 border-neutral-contrast/10 p-8">
            <div className="flex flex-col md:flex-row items-center gap-8">
              <img
                src={getHighResArtwork(gameData.revealedAnswer.track.artwork, 800)}
                alt="Album artwork"
                className="w-64 h-64 rounded-lg border-2 border-neutral-contrast/10"
              />
              <div className="flex-1 text-center md:text-left space-y-2">
                <h2 className="text-4xl font-bold text-primary">{gameData.revealedAnswer.track.name}</h2>
                <p className="text-3xl text-neutral-contrast/70">{gameData.revealedAnswer.track.artist}</p>
              </div>
            </div>
          </div>

          <div className="bg-neutral2 rounded-xl border-2 border-neutral-contrast/10 p-6">
            <h2 className="text-2xl font-primary font-bold text-primary mb-6">Player Results</h2>
            <div className="space-y-3">
              {[...gameData.revealedAnswer.submissions]
                .sort((a, b) => (b.points || 0) - (a.points || 0))
                .map((sub, i) => (
                  <div key={i} className="bg-neutral3 p-6 rounded-lg border-2 border-neutral-contrast/10">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center border-2 border-primary/30">
                          <span className="text-primary font-bold text-lg">{i + 1}</span>
                        </div>
                        <span className="font-bold text-2xl">{sub.playerName}</span>
                      </div>
                      <div className="text-right">
                        <div className="text-3xl font-bold text-primary">+{sub.points}</div>
                        <div className="text-sm text-neutral-contrast/70">points</div>
                      </div>
                    </div>
                    
                    <div className="space-y-2 ml-15">
                      <div className="flex items-center space-x-2">
                        <span className="text-neutral-contrast/70">Track:</span>
                        <span className="font-medium">{sub.trackGuess}</span>
                        {sub.trackCorrect ? (
                          <CheckIcon className="h-5 w-5 text-green-500" />
                        ) : (
                          <XMarkIcon className="h-5 w-5 text-red-500" />
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-neutral-contrast/70">Artist:</span>
                        <span className="font-medium">{sub.artistGuess}</span>
                        {sub.artistCorrect ? (
                          <CheckIcon className="h-5 w-5 text-green-500" />
                        ) : (
                          <XMarkIcon className="h-5 w-5 text-red-500" />
                        )}
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>

          <div className="bg-neutral2 rounded-xl border-2 border-neutral-contrast/10 p-6">
            <h2 className="text-2xl font-primary font-bold text-primary mb-6">Current Standings</h2>
            <div className="space-y-3">
              {Object.entries(scores)
                .sort(([, a], [, b]) => (b as number) - (a as number))
                .map(([playerId, score], i) => {
                  const player = session.players.find(p => p.userId === playerId || p.unId === playerId);
                  return (
                    <div key={playerId} className="bg-neutral3 p-4 rounded-lg border-2 border-neutral-contrast/10 flex justify-between items-center">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center border-2 border-primary/30">
                          <span className="text-primary font-bold">{i + 1}</span>
                        </div>
                        <span className="font-medium text-lg">{player?.name || 'Unknown'}</span>
                      </div>
                      <span className="text-2xl font-bold text-primary">{score}</span>
                    </div>
                  );
                })}
            </div>
          </div>

          <button
            onClick={handleNextRound}
            disabled={isProcessing}
            className={isProcessing ? 'btn-disabled' : 'btn-primary'}
          >
            {isProcessing ? <Loader /> : round + 1 >= tracks.length ? 'End Game' : 'Next Round'}
          </button>
        </div>
      )}
    </motion.div>
  );
};

export default IpodWarHostUI;