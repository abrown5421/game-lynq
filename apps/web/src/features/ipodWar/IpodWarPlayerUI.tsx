import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { IpodWarGameData } from './types';
import { useGameActionMutation, useGetSessionByIdQuery } from '../../app/store/api/sessionsApi';
import { useParams } from 'react-router-dom';
import { ISession } from '../../types/session.types';
import Loader from '../loader/Loader';
import { getHighResArtwork } from './utils';
import { CheckIcon, ClockIcon, ExclamationTriangleIcon, XMarkIcon } from '@heroicons/react/24/solid';

interface Props {
  session: ISession;
}

const IpodWarPlayerUI = ({ session }: Props) => {
  const { playerId } = useParams<{ playerId: string }>();
  const [gameAction] = useGameActionMutation();
  const { refetch } = useGetSessionByIdQuery(session._id, {
    pollingInterval: 1000
  });
  const [trackGuess, setTrackGuess] = useState('');
  const [artistGuess, setArtistGuess] = useState('');
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number>(0);

  if (!session.gameState?.data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral">
        <Loader />
      </div>
    );
  }

  const gameData = session.gameState.data as IpodWarGameData;
  const scores = session.gameState.scores || {};
  const { phase, round, tracks, settings, submissions, roundStartTime, revealedAnswer } = gameData;

  const player = session.players.find(p => p.userId === playerId || p.unId === playerId);
  const playerName = player?.name || 'Unknown';
  const playerScore = scores[playerId || ''] || 0;

  useEffect(() => {
    const submitted = submissions.some(s => s.playerId === playerId);
    setHasSubmitted(submitted);
  }, [submissions, playerId, phase]);

  useEffect(() => {
    if (phase !== 'playing' || !roundStartTime) {
      setTimeLeft(0);
      return;
    }

    const interval = setInterval(() => {
      const elapsed = Date.now() - roundStartTime;
      const remaining = Math.max(0, settings.roundDuration - Math.floor(elapsed / 1000));
      setTimeLeft(remaining);
    }, 100);

    return () => clearInterval(interval);
  }, [phase, roundStartTime, settings.roundDuration]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!playerId || (!trackGuess.trim() && !artistGuess.trim()) || hasSubmitted || isSubmitting) {
        return;
    }

    setIsSubmitting(true);

    try {
      const freshSession = await refetch().unwrap();
      const freshGameData = freshSession.gameState?.data as IpodWarGameData;
      const currentSubmissions = freshGameData.submissions || [];
      
      const actualPlayerId = playerId;
      
      const newSubmission = {
        playerId: actualPlayerId,
        playerName,
        trackGuess: trackGuess.trim(),
        artistGuess: artistGuess.trim(),
        submittedAt: Date.now(),
      };

      await gameAction({
        sessionId: session._id,
        action: 'updateData',
        payload: {
          data: {
            submissions: [...currentSubmissions, newSubmission],
          },
        },
      }).unwrap();

      setHasSubmitted(true);
    } catch (err) {
      console.error('Failed to submit:', err);
      alert('Failed to submit answer. Please try again.');
    } finally {
      setIsSubmitting(false);
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
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="bg-neutral2 rounded-xl border-2 border-neutral-contrast/10 p-6">
          <div className="flex justify-between items-center">
            <div>
              <div className="text-sm text-neutral-contrast/70">Player</div>
              <div className="text-2xl font-primary font-bold text-primary">{playerName}</div>
            </div>
            <div className="text-right">
              <div className="text-sm text-neutral-contrast/70">Score</div>
              <div className="text-3xl font-primary font-bold text-primary">{playerScore}</div>
            </div>
          </div>
        </div>

        {phase === 'playing' && (
          <div className="space-y-6">
            <div className="bg-neutral2 rounded-xl border-2 border-neutral-contrast/10 p-8 text-center">
              <h1 className="text-3xl font-primary font-bold text-primary mb-4">
                Round {round + 1} of {tracks.length}
              </h1>
              <div className="text-7xl font-bold text-primary mb-3">{timeLeft}s</div>
              <p className="text-neutral-contrast/70">Listen carefully and make your guess!</p>
            </div>

            {!hasSubmitted ? (
              <form onSubmit={handleSubmit} className="bg-neutral2 rounded-xl border-2 border-neutral-contrast/10 p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2 text-neutral-contrast/70">Track Name</label>
                  <input
                    type="text"
                    value={trackGuess}
                    onChange={(e) => setTrackGuess(e.target.value)}
                    placeholder="Enter track name..."
                    className="input-primary w-full"
                    disabled={isSubmitting}
                    autoComplete="off"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 text-neutral-contrast/70">Artist Name</label>
                  <input
                    type="text"
                    value={artistGuess}
                    onChange={(e) => setArtistGuess(e.target.value)}
                    placeholder="Enter artist name..."
                    className="input-primary w-full"
                    disabled={isSubmitting}
                    autoComplete="off"
                  />
                </div>

                <button
                  type="submit"
                  disabled={(!trackGuess.trim() && !artistGuess.trim()) || isSubmitting}
                  className={`w-full ${
                    (!trackGuess.trim() && !artistGuess.trim()) || isSubmitting
                      ? 'btn-disabled'
                      : 'btn-primary'
                  }`}
                >
                  {isSubmitting ? <Loader /> : 'Submit Answer'}
                </button>
              </form>
            ) : (
              <div className="bg-neutral2 rounded-xl border-2 border-green-500/30 p-8 flex flex-col items-center space-y-4">
                <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center border-2 border-green-500/30">
                  <CheckIcon className="h-5 w-5 text-green-500" />
                </div>
                <h2 className="text-2xl font-primary font-bold text-green-400">Answer Submitted!</h2>
                <p className="text-neutral-contrast/70">Waiting for other players...</p>
                <Loader />
              </div>
            )}
          </div>
        )}

        {phase === 'revealing' && revealedAnswer && (
          <div className="space-y-6">
            <div className="bg-neutral2 rounded-xl border-2 border-neutral-contrast/10 p-8 text-center">
              <h1 className="text-3xl font-primary font-bold text-primary mb-6">Round {round + 1} Results</h1>
              
              <img
                src={getHighResArtwork(revealedAnswer.track.artwork, 800)}
                alt="Album artwork"
                className="w-56 h-56 mx-auto rounded-lg border-2 border-neutral-contrast/10 mb-6"
              />
              <h2 className="text-3xl font-bold text-primary mb-2">{revealedAnswer.track.name}</h2>
              <p className="text-2xl text-neutral-contrast/70">{revealedAnswer.track.artist}</p>
            </div>

            {(() => {
              const mySubmission = revealedAnswer.submissions.find(s => s.playerId === playerId);
              
              if (!mySubmission) {
                return (
                  <div className="bg-neutral2 rounded-xl border-2 border-red-500/30 p-8 flex flex-col items-center space-y-4">
                    <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center border-2 border-red-500/30">
                      <ClockIcon className="h-15 w-15" />
                    </div>
                    <h3 className="text-2xl font-primary font-bold text-red-400">Time's Up!</h3>
                    <p className="text-neutral-contrast/70">You didn't submit an answer in time.</p>
                  </div>
                );
              }

              const isFullCorrect = mySubmission.trackCorrect && mySubmission.artistCorrect;
              const isPartialCorrect = mySubmission.trackCorrect || mySubmission.artistCorrect;
              
              return (
                <div className={`bg-neutral2 rounded-xl border-2 p-8 ${
                  isFullCorrect
                    ? 'border-green-500/30'
                    : isPartialCorrect
                    ? 'border-yellow-500/30'
                    : 'border-red-500/30'
                }`}>
                  <div className="text-center mb-6">
                    <div className="text-6xl mb-4 flex justify-center">
                      {isFullCorrect ? <CheckIcon className="h-15 w-15 text-green-500" /> : isPartialCorrect ? <ExclamationTriangleIcon className="h-15 w-15 text-yellow-500" /> : <XMarkIcon className="h-15 w-15 text-red-500" />}
                    </div>
                    <h3 className="text-4xl font-primary font-bold text-primary mb-2">
                      +{mySubmission.points} Points
                    </h3>
                  </div>
                  
                  <div className="bg-neutral3 rounded-lg p-6 border-2 border-neutral-contrast/10 space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-neutral-contrast/70">Your track guess:</span>
                      <div className="flex items-center space-x-2">
                        <span className="font-medium">{mySubmission.trackGuess}</span>
                        {mySubmission.trackCorrect ? (
                          <CheckIcon className="h-5 w-5 text-green-500" />
                        ) : (
                          <XMarkIcon className="h-5 w-5 text-red-500" />
                        )}
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-neutral-contrast/70">Your artist guess:</span>
                      <div className="flex items-center space-x-2">
                        <span className="font-medium">{mySubmission.artistGuess}</span>
                        {mySubmission.artistCorrect ? (
                          <CheckIcon className="h-5 w-5 text-green-500" />
                        ) : (
                          <XMarkIcon className="h-5 w-5 text-red-500" />
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}

            <div className="bg-neutral2 rounded-xl border-2 border-neutral-contrast/10 p-6">
              <h3 className="text-xl font-primary font-bold text-primary mb-4">Current Standings</h3>
              <div className="space-y-3">
                {[...Object.entries(scores)]
                  .sort(([, a], [, b]) => (b as number) - (a as number))
                  .map(([pId, score], i) => {
                    const p = session.players.find(pl => pl.userId === pId || pl.unId === pId);
                    const isMe = pId === playerId;
                    return (
                      <div 
                        key={pId} 
                        className={`p-4 rounded-lg flex justify-between items-center ${
                          isMe 
                            ? 'bg-primary/20 border-2 border-primary/30' 
                            : 'bg-neutral3 border-2 border-neutral-contrast/10'
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${
                            isMe ? 'bg-primary/30 border-primary/50' : 'bg-primary/20 border-primary/30'
                          }`}>
                            <span className="text-primary font-bold">{i + 1}</span>
                          </div>
                          <span className="font-medium text-lg">
                            {p?.name || 'Unknown'} {isMe && '(You)'}
                          </span>
                        </div>
                        <span className="text-2xl font-bold text-primary">{score}</span>
                      </div>
                    );
                  })}
              </div>
            </div>

            <div className="bg-neutral2 rounded-xl border-2 border-neutral-contrast/10 p-8 flex flex-col items-center space-y-4">
              <Loader />
              <p className="text-neutral-contrast/70 text-center">
                Waiting for host to start next round...
              </p>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default IpodWarPlayerUI;