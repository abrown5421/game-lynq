import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { IpodWarGameData } from './types';
import { useGameActionMutation, useGetSessionByIdQuery } from '../../app/store/api/sessionsApi';
import { useParams } from 'react-router-dom';
import { ISession } from '../../types/session.types';
import Loader from '../loader/Loader';

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
      <div className="min-h-screen flex items-center justify-center">
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
    
    if (phase === 'playing' && !submitted) {
      setTrackGuess('');
      setArtistGuess('');
    }
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
      <div className="max-w-2xl mx-auto">
        <div className="bg-accent/20 rounded-lg p-4 mb-6 flex justify-between items-center">
          <div>
            <div className="text-sm opacity-70">Player</div>
            <div className="text-xl font-bold">{playerName}</div>
            <div className="text-xs opacity-50">ID: {playerId}</div>
          </div>
          <div className="text-right">
            <div className="text-sm opacity-70">Score</div>
            <div className="text-2xl font-primary text-primary">{playerScore}</div>
          </div>
        </div>

        {phase === 'playing' && (
          <div className="space-y-6">
            <div className="text-center">
              <h1 className="text-3xl font-bold mb-2">Round {round + 1} of {tracks.length}</h1>
              <div className="text-5xl font-primary text-primary mb-2">{timeLeft}s</div>
              <p className="opacity-70">Listen carefully and make your guess!</p>
            </div>

            {!hasSubmitted ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Track Name</label>
                  <input
                    type="text"
                    value={trackGuess}
                    onChange={(e) => setTrackGuess(e.target.value)}
                    placeholder="Enter track name..."
                    className="w-full px-4 py-3 bg-accent/20 rounded-lg border border-accent/30 focus:border-primary focus:outline-none"
                    disabled={isSubmitting}
                    autoComplete="off"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Artist Name</label>
                  <input
                    type="text"
                    value={artistGuess}
                    onChange={(e) => setArtistGuess(e.target.value)}
                    placeholder="Enter artist name..."
                    className="w-full px-4 py-3 bg-accent/20 rounded-lg border border-accent/30 focus:border-primary focus:outline-none"
                    disabled={isSubmitting}
                    autoComplete="off"
                  />
                </div>

                <button
                    type="submit"
                    disabled={!trackGuess.trim() && !artistGuess.trim() || isSubmitting}
                    className={`w-full py-4 rounded-lg font-bold text-lg ${
                        (!trackGuess.trim() && !artistGuess.trim()) || isSubmitting
                        ? 'bg-neutral-contrast/20 cursor-not-allowed'
                        : 'btn-primary'
                    }`}
                    >
                    {isSubmitting ? <Loader /> : 'Submit Answer'}
                </button>
              </form>
            ) : (
              <div className="bg-green-500/20 border-2 border-green-500 rounded-lg p-8 text-center flex-col flex items-center">
                <div className="text-4xl mb-4">✓</div>
                <h2 className="text-2xl font-bold mb-2">Answer Submitted!</h2>
                <p className="opacity-70">Waiting for other players...</p>
                <div className="mt-4">
                  <Loader />
                </div>
              </div>
            )}
          </div>
        )}

        {phase === 'revealing' && revealedAnswer && (
          <div className="space-y-6">
            <div className="text-center">
              <h1 className="text-3xl font-bold mb-4">Round {round + 1} Results</h1>
            </div>

            <div className="bg-accent/20 rounded-lg p-6 text-center">
              <img
                src={revealedAnswer.track.artwork}
                alt="Album artwork"
                className="w-48 h-48 mx-auto rounded-lg shadow-lg mb-4"
              />
              <h2 className="text-2xl font-bold mb-1">{revealedAnswer.track.name}</h2>
              <p className="text-xl opacity-70">{revealedAnswer.track.artist}</p>
            </div>

            {(() => {
              
              const mySubmission = revealedAnswer.submissions.find(s => s.playerId === playerId);
              
              if (!mySubmission) {
                return (
                  <div className="bg-red-500/20 border-2 border-red-500 rounded-lg p-6 text-center">
                    <div className="text-3xl mb-2">⏱️</div>
                    <h3 className="text-xl font-bold mb-1">Time's Up!</h3>
                    <p className="opacity-70">You didn't submit an answer in time.</p>
                    <p className="text-xs opacity-50 mt-2">Debug: Player ID = {playerId}</p>
                  </div>
                );
              }

              return (
                <div className={`border-2 rounded-lg p-6 ${
                  mySubmission.trackCorrect && mySubmission.artistCorrect
                    ? 'bg-green-500/20 border-green-500'
                    : mySubmission.trackCorrect || mySubmission.artistCorrect
                    ? 'bg-yellow-500/20 border-yellow-500'
                    : 'bg-red-500/20 border-red-500'
                }`}>
                  <div className="text-center mb-4">
                    <div className="text-4xl mb-2">
                      {mySubmission.trackCorrect && mySubmission.artistCorrect ? '🎉' : 
                       mySubmission.trackCorrect || mySubmission.artistCorrect ? '👍' : '😞'}
                    </div>
                    <h3 className="text-2xl font-bold mb-2">+{mySubmission.points} Points</h3>
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between items-center">
                      <span>Your track guess:</span>
                      <span className="font-medium">
                        {mySubmission.trackGuess} {mySubmission.trackCorrect ? '✓' : '✗'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Your artist guess:</span>
                      <span className="font-medium">
                        {mySubmission.artistGuess} {mySubmission.artistCorrect ? '✓' : '✗'}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })()}

            <div className="bg-accent/10 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-3">Current Standings</h3>
              <div className="space-y-2">
                {[...Object.entries(scores)]
                  .sort(([, a], [, b]) => (b as number) - (a as number))
                  .map(([pId, score], i) => {
                    const p = session.players.find(pl => pl.userId === pId || pl.unId === pId);
                    const isMe = pId === playerId;
                    return (
                      <div 
                        key={pId} 
                        className={`p-3 rounded flex justify-between items-center ${
                          isMe ? 'bg-primary/30 border border-primary' : 'bg-accent/20'
                        }`}
                      >
                        <span className="font-medium">
                          {i + 1}. {p?.name || 'Unknown'} {isMe && '(You)'}
                        </span>
                        <span className="text-lg font-bold">{score}</span>
                      </div>
                    );
                  })}
              </div>
            </div>

            <div className="bg-accent/20 rounded-lg p-6 text-center flex flex-col items-center">
              <Loader />
              <p className="mt-3 opacity-70">Waiting for host to start next round...</p>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default IpodWarPlayerUI;