import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { useConnectSpotifyMutation, useDisconnectSpotifyMutation, useGetSpotifyStatusQuery } from '../../app/store/api/spotifyApi';
import { useAppDispatch } from '../../app/store/hooks';
import { openAlert } from '../alert/alertSlice';
import Loader from '../loader/Loader';
import { MusicalNoteIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/solid';

interface SpotifyConnectionProps {
  compact?: boolean;
}

const SpotifyConnection = ({ compact = false }: SpotifyConnectionProps) => {
  const dispatch = useAppDispatch();
  const { data: status, isLoading, refetch } = useGetSpotifyStatusQuery();
  const [connectSpotify, { isLoading: isConnecting }] = useConnectSpotifyMutation();
  const [disconnectSpotify, { isLoading: isDisconnecting }] = useDisconnectSpotifyMutation();
  const [checkingConnection, setCheckingConnection] = useState(false);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const spotifyConnected = urlParams.get('spotify_connected');
    const spotifyError = urlParams.get('spotify_error');

    if (spotifyConnected === 'true') {
      setCheckingConnection(true);
      setTimeout(() => {
        refetch().then(() => {
          setCheckingConnection(false);
          dispatch(
            openAlert({
              open: true,
              closeable: true,
              severity: 'success',
              message: 'Spotify connected successfully!',
              anchor: { x: 'right', y: 'bottom' },
            })
          );
        });
      }, 1000);

      window.history.replaceState({}, document.title, window.location.pathname);
    }

    if (spotifyError) {
      dispatch(
        openAlert({
          open: true,
          closeable: true,
          severity: 'error',
          message: `Spotify connection failed: ${spotifyError}`,
          anchor: { x: 'right', y: 'bottom' },
        })
      );

      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [dispatch, refetch]);

  const handleConnect = async () => {
    try {
      const result = await connectSpotify().unwrap();
      window.location.href = result.authUrl;
    } catch (error: any) {
      dispatch(
        openAlert({
          open: true,
          closeable: true,
          severity: 'error',
          message: error?.data?.error || 'Failed to connect to Spotify',
          anchor: { x: 'right', y: 'bottom' },
        })
      );
    }
  };

  const handleDisconnect = async () => {
    try {
      await disconnectSpotify().unwrap();
      dispatch(
        openAlert({
          open: true,
          closeable: true,
          severity: 'success',
          message: 'Spotify disconnected successfully',
          anchor: { x: 'right', y: 'bottom' },
        })
      );
    } catch (error: any) {
      dispatch(
        openAlert({
          open: true,
          closeable: true,
          severity: 'error',
          message: error?.data?.error || 'Failed to disconnect Spotify',
          anchor: { x: 'right', y: 'bottom' },
        })
      );
    }
  };

  if (isLoading || checkingConnection) {
    return (
      <div className={`${compact ? 'p-4' : 'p-6'} bg-neutral2 rounded-xl border-2 border-neutral-contrast/10 flex items-center justify-center`}>
        <Loader />
      </div>
    );
  }

  if (compact) {
    return (
      <div className="bg-neutral2 rounded-xl border-2 border-neutral-contrast/10 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
              status?.connected ? 'bg-green-500/20 border-2 border-green-500/30' : 'bg-neutral3 border-2 border-neutral-contrast/10'
            }`}>
              <MusicalNoteIcon className={`h-5 w-5 ${status?.connected ? 'text-green-500' : 'text-neutral-contrast/50'}`} />
            </div>
            <div>
              <p className="text-sm font-medium text-neutral-contrast">
                {status?.connected ? 'Spotify Connected' : 'Spotify'}
              </p>
              {status?.connected && status.spotifyDisplayName && (
                <p className="text-xs text-neutral-contrast/60">{status.spotifyDisplayName}</p>
              )}
            </div>
          </div>
          
          {status?.connected ? (
            <button
              onClick={handleDisconnect}
              disabled={isDisconnecting}
              className="px-3 py-1.5 text-sm bg-red-500/20 text-red-400 rounded-lg border-2 border-red-500/30 hover:bg-red-500 hover:text-white transition-all disabled:opacity-50"
            >
              {isDisconnecting ? <Loader /> : 'Disconnect'}
            </button>
          ) : (
            <button
              onClick={handleConnect}
              disabled={isConnecting}
              className="px-3 py-1.5 text-sm bg-green-500/20 text-green-400 rounded-lg border-2 border-green-500/30 hover:bg-green-500 hover:text-white transition-all disabled:opacity-50"
            >
              {isConnecting ? <Loader /> : 'Connect'}
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-neutral2 rounded-xl border-2 border-neutral-contrast/10 p-6 space-y-4"
    >
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-primary font-bold text-primary">Spotify Integration</h3>
        {status?.connected ? (
          <CheckCircleIcon className="h-6 w-6 text-green-500" />
        ) : (
          <XCircleIcon className="h-6 w-6 text-red-500" />
        )}
      </div>

      {status?.connected ? (
        <div className="space-y-4">
          <div className="bg-green-500/10 border-2 border-green-500/20 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center shrink-0 border-2 border-green-500/30">
                <MusicalNoteIcon className="h-6 w-6 text-green-500" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-neutral-contrast">Connected as {status.spotifyDisplayName}</p>
                <p className="text-sm text-neutral-contrast/60 mt-1">{status.spotifyEmail}</p>
                <p className="text-xs text-neutral-contrast/50 mt-2">
                  You can now use Spotify Premium features in Ipod War!
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={handleDisconnect}
            disabled={isDisconnecting}
            className={isDisconnecting ? 'btn-disabled w-full' : 'btn-error w-full'}
          >
            {isDisconnecting ? <Loader /> : 'Disconnect Spotify'}
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="bg-neutral3 rounded-lg p-4 border-2 border-neutral-contrast/10">
            <p className="text-neutral-contrast/70 text-sm mb-3">
              Connect your Spotify Premium account to unlock enhanced features:
            </p>
            <ul className="space-y-2 text-sm text-neutral-contrast/60">
              <li className="flex items-start">
                <span className="text-primary mr-2">•</span>
                <span>Search your favorite artists and playlists</span>
              </li>
              <li className="flex items-start">
                <span className="text-primary mr-2">•</span>
                <span>Access full artist discographies</span>
              </li>
              <li className="flex items-start">
                <span className="text-primary mr-2">•</span>
                <span>Higher quality audio previews</span>
              </li>
              <li className="flex items-start">
                <span className="text-primary mr-2">•</span>
                <span>Custom playlists for game sessions</span>
              </li>
            </ul>
          </div>

          <div className="bg-yellow-500/10 border-2 border-yellow-500/20 rounded-lg p-3">
            <p className="text-xs text-yellow-500">
              Requires Spotify Premium subscription
            </p>
          </div>

          <button
            onClick={handleConnect}
            disabled={isConnecting}
            className={isConnecting ? 'btn-disabled w-full' : 'btn-success w-full'}
          >
            {isConnecting ? <Loader /> : 'Connect Spotify Premium'}
          </button>
        </div>
      )}
    </motion.div>
  );
};

export default SpotifyConnection;