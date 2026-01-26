import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { useJoinSessionMutation, useLeaveSessionMutation, useUpdatePlayerNameMutation, useLazyGetSessionByIdQuery } from '../../app/store/api/sessionsApi';
import Loader from '../../features/loader/Loader';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppSelector } from '../../app/store/hooks';

const Join = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAppSelector((state) => state.auth);
  const { "*": paramCode } = useParams<{ "*": string }>();
  const [code, setCode] = useState(paramCode || "");
  const [name, setName] = useState(user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : "");
  const [unId, setUnId] = useState("");
  const [session, setSession] = useState<any>(null);
  const [isEditingName, setIsEditingName] = useState(false);
  const [newName, setNewName] = useState("");
  const [error, setError] = useState("");
  const [wasKicked, setWasKicked] = useState(false);
  const [joinSession, { isLoading: isJoining }] = useJoinSessionMutation();
  const [leaveSession, { isLoading: isLeaving }] = useLeaveSessionMutation();
  const [updatePlayerName, { isLoading: isUpdating }] = useUpdatePlayerNameMutation();
  const [fetchSession] = useLazyGetSessionByIdQuery();

  useEffect(() => {
    if (!session || wasKicked) return;

    const interval = setInterval(async () => {
      try {
        const result = await fetchSession(session._id).unwrap();
        
        const currentUserId = isAuthenticated ? user?._id : unId;
        const playerStillInSession = result.players.find(
          (p: any) => 
            (p.userId && p.userId === currentUserId) ||
            (p.unId && p.unId === currentUserId)
        );
        
        if (!playerStillInSession) {
          setWasKicked(true);
          setSession(null);
          return;
        }
        
        setName(playerStillInSession.name);
        setSession(result);
        
        if (result.status === 'playing') {
          const playerId = playerStillInSession.userId || playerStillInSession.unId;
          navigate(`/join/${result._id}/${playerId}/game`);  
        }
      } catch (err) {
        console.error('Failed to fetch session:', err);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [session, fetchSession, navigate, isAuthenticated, user?._id, unId, wasKicked]);

  const handleJoin = async () => {
    if (!code || !name) {
      setError("Please enter both code and name");
      return;
    }

    if (!isAuthenticated && !unId) {
      setError("Please enter a User Secret to join");
      return;
    }

    setError("");
    setWasKicked(false);

    try {
      const joined = await joinSession({ 
        code, 
        name,
        userId: isAuthenticated ? user?._id : undefined,
        unId: !isAuthenticated ? unId : undefined
      }).unwrap();
      
      setSession(joined);
    } catch (err: any) {
      console.error(err);
      setError(err?.data?.error || 'Failed to join session');
    }
  };

  const handleLeave = async () => {
    if (!session || !name) return;

    try {
      await leaveSession({ 
        sessionId: session._id, 
        data: { playerName: name } 
      }).unwrap();
      setSession(null);
      setError("");
      setWasKicked(false);
    } catch (err) {
      console.error('Failed to leave session:', err);
      setError('Failed to leave session');
    }
  };

  const handleUpdateName = async () => {
    if (!session || !newName || newName === name) {
      setIsEditingName(false);
      return;
    }

    try {
      const updated = await updatePlayerName({
        sessionId: session._id,
        data: { oldName: name, newName }
      }).unwrap();
      
      setSession(updated);
      setName(newName);
      setIsEditingName(false);
      setError("");
    } catch (err: any) {
      console.error('Failed to update name:', err);
      setError(err?.data?.error || 'Failed to update name');
    }
  };

  const handleReturnToJoin = () => {
    setSession(null);
    setWasKicked(false);
    setError("");
    setCode("");
    setName(user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : "");
    setUnId("");
  };

  if (isJoining || isLeaving) {
    return (
      <div className="w-screen h-screen bg-neutral flex items-center justify-center">
        <Loader />
      </div>
    );
  }

  if (wasKicked) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        className="bg-neutral text-neutral-contrast min-h-screen p-6 flex items-center justify-center"
      >
        <div className="w-full max-w-lg bg-neutral2 rounded-xl border-2 border-red-500/30 p-8 flex flex-col items-center space-y-6">
          <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center border-2 border-red-500/30">
            <span className="text-5xl">⚠️</span>
          </div>
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-primary font-bold text-red-400">Removed from Session</h2>
            <p className="text-neutral-contrast/70">
              You have been removed from the session by the host.
            </p>
          </div>
          <button
            onClick={handleReturnToJoin}
            className="btn-primary w-full"
          >
            Return to Join Screen
          </button>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-neutral text-neutral-contrast min-h-screen p-6 flex items-center justify-center"
    >
      <div className="w-full max-w-lg">
        {!session ? (
          <div className="bg-neutral2 rounded-xl border-2 border-neutral-contrast/10 p-8 space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-3xl font-primary font-bold text-primary">Join Session</h2>
              <p className="text-neutral-contrast/70">Enter the room code to get started</p>
            </div>
            
            {error && (
              <div className="bg-red-500/20 border-2 border-red-500/30 text-red-400 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-neutral-contrast/70">Room Code</label>
                <input
                  type="text"
                  placeholder="Enter 4-digit code"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  className="input-primary w-full text-center text-2xl font-mono tracking-widest"
                  maxLength={4}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-neutral-contrast/70">Your Name</label>
                <input
                  type="text"
                  placeholder="Enter your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="input-primary w-full"
                />
              </div>
              
              {!isAuthenticated && (
                <div>
                  <label className="block text-sm font-medium mb-2 text-neutral-contrast/70">User Secret</label>
                  <input
                    type="text"
                    placeholder="Enter a memorable code"
                    value={unId}
                    onChange={(e) => setUnId(e.target.value)}
                    className="input-primary w-full"
                  />
                  <p className="text-xs text-neutral-contrast/50 mt-2">
                    This helps you rejoin if you get disconnected
                  </p>
                </div>
              )}
            </div>
            
            <button
              onClick={handleJoin}
              disabled={!code || !name || (!isAuthenticated && !unId)}
              className={`w-full ${!code || !name || (!isAuthenticated && !unId) ? 'btn-disabled' : 'btn-primary'}`}
            >
              Join Session
            </button>
          </div>
        ) : (
          <div className="bg-neutral2 rounded-xl border-2 border-neutral-contrast/10 overflow-hidden">
            <div className="p-8 space-y-6">
              <div className="text-center space-y-2">
                <h2 className="text-3xl font-primary font-bold text-primary">
                  Welcome, {name}!
                </h2>
                <p className="text-neutral-contrast/70">Room Code: <span className="font-mono text-primary">{code}</span></p>
              </div>
              
              {error && (
                <div className="bg-red-500/20 border-2 border-red-500/30 text-red-400 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              {isEditingName ? (
                <div className="space-y-3">
                  <input
                    type="text"
                    placeholder="New Name"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="input-primary w-full"
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => {
                        setIsEditingName(false);
                        setNewName("");
                        setError("");
                      }}
                      className="btn-gray"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleUpdateName}
                      disabled={isUpdating || !newName}
                      className={isUpdating || !newName ? 'btn-disabled' : 'btn-primary'}
                    >
                      {isUpdating ? 'Saving...' : 'Save'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-neutral3 rounded-lg p-6 border-2 border-neutral-contrast/10 flex flex-col items-center space-y-4">
                  <Loader />
                  <p className="text-neutral-contrast/70 text-center">
                    Waiting for the host to start the game...
                  </p>
                </div>
              )}
            </div>

            <div className="bg-neutral3 p-4 border-t-2 border-neutral-contrast/10 grid grid-cols-2 gap-3">
              <button
                onClick={() => {
                  setNewName(name);
                  setIsEditingName(true);
                }}
                className="btn-secondary"
              >
                Change Name
              </button>
              <button
                onClick={handleLeave}
                className="btn-error"
              >
                Exit Session
              </button>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default Join;