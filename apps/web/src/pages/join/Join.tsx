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
      <div className="w-screen h-screen bg-neutral-contrast flex items-center justify-center">
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
        className="bg-neutral text-neutral-contrast sup-min-nav relative z-0 min-h-screen p-4 flex flex-col justify-center items-center space-y-6"
      >
        <div className="w-full max-w-lg bg-red-500/20 border-2 border-red-500 p-6 rounded-lg shadow-md flex flex-col items-center space-y-4 text-center">
          <div className="text-4xl">⚠️</div>
          <h2 className="text-2xl text-red-200 font-primary">Removed from Session</h2>
          <p className="text-red-100">
            You have been removed from the session by the host.
          </p>
          <button
            onClick={handleReturnToJoin}
            className="btn-primary mt-4 w-full"
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
      className="bg-neutral text-neutral-contrast sup-min-nav relative z-0 min-h-screen p-4 flex flex-col justify-center items-center space-y-6"
    >
      {!session ? (
        <div className="w-full max-w-lg bg-accent p-6 rounded-lg shadow-md flex flex-col items-center space-y-3 text-center">
          <h2 className="text-2xl text-accent-contrast font-primary">Join Session</h2>
          
          {error && (
            <div className="w-full bg-red-500/20 border border-red-500 text-red-200 px-3 py-2 rounded">
              {error}
            </div>
          )}

          <input
            type="text"
            placeholder="Room Code"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            className="input-primary w-full mt-3"
            maxLength={4}
          />
          <input
            type="text"
            placeholder="Your Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="input-primary w-full"
          />
          
          {!isAuthenticated && (
            <div className='flex flex-col w-full'>
              <input
                type="text"
                placeholder="User Secret"
                value={unId}
                onChange={(e) => setUnId(e.target.value)}
                className="input-primary w-full"
              />
              <div className='text-sm text-accent-contrast/80 mt-2'>
                Enter a memorable secret code to rejoin if you get disconnected
              </div>
            </div>
          )}
          
          <button
            onClick={handleJoin}
            disabled={!code || !name || (!isAuthenticated && !unId)}
            className={`${!code || !name || (!isAuthenticated && !unId) ? 'btn-disabled cursor-not-allowed' : 'btn-primary'} mt-3`}
          >
            Join Session
          </button>
        </div>
      ) : (
        <div className='w-full max-w-lg'>
        <div className="bg-accent p-6 space-y-4 w-full rounded-t-md flex flex-col justify-center items-center">
          <h2 className="text-2xl text-accent-contrast">
            Welcome to room {code}, {name}!
          </h2>
          
          {error && (
            <div className="w-full bg-red-500/20 border border-red-500 text-red-200 px-3 py-2 rounded">
              {error}
            </div>
          )}

          {isEditingName && (
            <div className="w-full space-y-2">
              <input
                type="text"
                placeholder="New Name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="input-primary w-full"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setIsEditingName(false);
                    setNewName("");
                    setError("");
                  }}
                  className="btn-gray flex-1"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdateName}
                  disabled={isUpdating || !newName}
                  className="btn-primary flex-1"
                >
                  {isUpdating ? 'Updating...' : 'Save'}
                </button>
              </div>
            </div>
          )}

          <div className='text-sm text-accent-contrast/80 text-center my-4'>
            <Loader />
          </div>
          
          <p className="text-s text-accent-contrast text-center">
            Waiting for the host to start the game...
          </p>

        </div>
        <div className="w-full p-3 gap-3 flex flex-row bg-neutral-contrast/90 rounded-b-md">
          <button
            onClick={() => {
              setNewName(name);
              setIsEditingName(true);
            }}
            className="btn-primary"
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
    </motion.div>
  );
};

export default Join;