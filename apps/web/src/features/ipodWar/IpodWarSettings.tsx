import { motion } from 'framer-motion';
import { useState } from "react";
import { openAlert } from '../alert/alertSlice';
import { useAppDispatch } from '../../app/store/hooks';
import { useGameActionMutation, useStartGameMutation } from '../../app/store/api/sessionsApi';
import { useNavigate, useParams } from 'react-router-dom';
import Loader from '../loader/Loader';
import SpotifyConnection from '../spotifyConnection/SpotifyConnection';
import { useGetSpotifyStatusQuery, useLazySearchSpotifyQuery, useLazyGetArtistTracksQuery, useLazyGetPlaylistTracksQuery } from '../../app/store/api/spotifyApi';
import { MusicalNoteIcon, UserGroupIcon, MagnifyingGlassIcon } from '@heroicons/react/24/solid';

const MIN_TRACKS = 20;
const MAX_TRACKS = 200;
const DEFAULT_TRACKS = 60;
const DEFAULT_ROUND_DURATION = 60;

type MusicProvider = 'itunes' | 'spotify';

const IpodWarSettings = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [gameAction] = useGameActionMutation();
  const [startGame] = useStartGameMutation();
  const { data: spotifyStatus } = useGetSpotifyStatusQuery();
  const [searchSpotify, { data: searchResults, isLoading: isSearching }] = useLazySearchSpotifyQuery();
  const [getArtistTracks, { isLoading: isLoadingArtist }] = useLazyGetArtistTracksQuery();
  const [getPlaylistTracks, { isLoading: isLoadingPlaylist }] = useLazyGetPlaylistTracksQuery();
  const [loadingGame, setLoadingGame] = useState(false);
  const [musicProvider, setMusicProvider] = useState<MusicProvider>('itunes');
  const [searchTerm, setSearchTerm] = useState("");
  const [spotifyQuery, setSpotifyQuery] = useState("");
  const [selectedSource, setSelectedSource] = useState<{ type: 'artist' | 'playlist'; id: string; name: string } | null>(null);
  const [trackCount, setTrackCount] = useState(DEFAULT_TRACKS);
  const [roundDuration, setRoundDuration] = useState(DEFAULT_ROUND_DURATION);
  const [guessArtist, setGuessArtist] = useState(true);
  const [errors, setErrors] = useState({
    searchTerm: '',
    spotifyQuery: '',
    trackCount: '',
    roundDuration: '',
  });

  const validate = () => {
    let valid = true;
    const newErrors = { searchTerm: '', spotifyQuery: '', trackCount: '', roundDuration: '' };

    if (musicProvider === 'itunes' && !searchTerm.trim()) {
      newErrors.searchTerm = 'Please enter a search term';
      valid = false;
    }

    if (musicProvider === 'spotify' && !selectedSource) {
      newErrors.spotifyQuery = 'Please select an artist or playlist';
      valid = false;
    }

    if (trackCount < MIN_TRACKS || trackCount > MAX_TRACKS) {
      newErrors.trackCount = `Tracks must be between ${MIN_TRACKS} and ${MAX_TRACKS}`;
      valid = false;
    }

    if (roundDuration < 5) {
      newErrors.roundDuration = 'Round duration must be at least 5 seconds';
      valid = false;
    }

    setErrors(newErrors);

    if (!valid) {
      dispatch(openAlert({
        open: true,
        closeable: true,
        severity: 'error',
        message: 'Please fix the errors in the form',
        anchor: { x: 'right', y: 'bottom' },
      }));
    }

    return valid;
  };

  const handleSpotifySearch = async () => {
    if (!spotifyQuery.trim()) return;
    
    try {
      await searchSpotify({ query: spotifyQuery, limit: 10 }).unwrap();
    } catch (err) {
      dispatch(openAlert({
        open: true,
        closeable: true,
        severity: 'error',
        message: 'Failed to search Spotify. Please try again.',
        anchor: { x: 'right', y: 'bottom' },
      }));
    }
  };

  const handleSelectArtist = async (artistId: string, artistName: string) => {
    setSelectedSource({ type: 'artist', id: artistId, name: artistName });
    setErrors({ ...errors, spotifyQuery: '' });
  };

  const handleSelectPlaylist = async (playlistId: string, playlistName: string) => {
    setSelectedSource({ type: 'playlist', id: playlistId, name: playlistName });
    setErrors({ ...errors, spotifyQuery: '' });
  };

  const handleStartGame = async () => {
    if (!validate() || !id) return;
    setLoadingGame(true);

    try {
      let tracks: any[] = [];

      if (musicProvider === 'itunes') {
        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/integrations/itunes/search?term=${encodeURIComponent(searchTerm)}&limit=200`,
          { headers: { Accept: "application/json" }, credentials: 'include' }
        );

        const data = await response.json();

        tracks = data.tracks
          .sort(() => Math.random() - 0.5)
          .slice(0, trackCount)
          .map((t: any) => ({
            name: t.trackName,
            artist: t.artistName,
            previewUrl: t.previewUrl,
            artwork: t.artworkUrl100,
          }));
      } else if (musicProvider === 'spotify' && selectedSource) {
        let tracksData;
        
        if (selectedSource.type === 'artist') {
          tracksData = await getArtistTracks({ artistId: selectedSource.id, limit: trackCount }).unwrap();
        } else {
          tracksData = await getPlaylistTracks({ playlistId: selectedSource.id, limit: trackCount }).unwrap();
        }

        tracks = tracksData.tracks
          .sort(() => Math.random() - 0.5)
          .slice(0, trackCount);
      }

      if (tracks.length === 0) {
        throw new Error('No tracks found');
      }

      await gameAction({
        sessionId: id,
        action: "updateData",
        payload: {
          data: {
            currentTrack: tracks[0],
            tracks,
            round: 0,
            roundStartTime: Date.now(),
            submissions: [],
            revealedAnswer: null,
            readyPlayers: [],
            phase: "playing",
            settings: { 
              searchTerm: musicProvider === 'itunes' ? searchTerm : selectedSource?.name || '',
              trackCount, 
              roundDuration, 
              guessArtist,
              musicProvider,
            },
          },
        },
      });

      await startGame(id);
      navigate(`/host/${id}/game`);

    } catch (err) {
      console.error(err);
      dispatch(openAlert({
        open: true,
        closeable: true,
        severity: "error",
        message: "Failed to fetch tracks.",
        anchor: { x: "right", y: "bottom" },
      }));
    } finally {
      setLoadingGame(false);
    }
  };

  const canUseSpotify = spotifyStatus?.connected;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      className="bg-neutral text-neutral-contrast min-h-screen p-6"
    >
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="bg-neutral2 rounded-xl border-2 border-neutral-contrast/10 p-8 text-center">
          <h1 className="text-4xl font-primary font-bold text-primary mb-2">
            Ipod War Settings
          </h1>
          <p className="text-neutral-contrast/70">
            Configure your music guessing game
          </p>
        </div>

        <div className="bg-neutral2 rounded-xl border-2 border-neutral-contrast/10 p-6 space-y-4">
          <label className="block text-lg font-medium text-neutral-contrast">Music Source</label>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={() => setMusicProvider('itunes')}
              className={`p-6 rounded-xl border-2 transition-all text-left ${
                musicProvider === 'itunes'
                  ? 'border-primary bg-primary/10'
                  : 'border-neutral-contrast/10 hover:border-neutral-contrast/30'
              }`}
            >
              <div className="flex items-start space-x-4">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${
                  musicProvider === 'itunes' ? 'bg-primary/20 border-2 border-primary/30' : 'bg-neutral3'
                }`}>
                  <MusicalNoteIcon className={`h-6 w-6 ${musicProvider === 'itunes' ? 'text-primary' : 'text-neutral-contrast/50'}`} />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-lg">iTunes (Free)</h3>
                  <p className="text-sm text-neutral-contrast/70 mt-1">
                    Search any artist or genre. Uses iTunes 30-second previews.
                  </p>
                  <span className="inline-block mt-2 px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded border border-green-500/30">
                    Always Available
                  </span>
                </div>
              </div>
            </button>

            <button
              onClick={() => canUseSpotify && setMusicProvider('spotify')}
              disabled={!canUseSpotify}
              className={`p-6 rounded-xl border-2 transition-all text-left ${
                !canUseSpotify
                  ? 'opacity-50 cursor-not-allowed border-neutral-contrast/10'
                  : musicProvider === 'spotify'
                  ? 'border-primary bg-primary/10'
                  : 'border-neutral-contrast/10 hover:border-neutral-contrast/30'
              }`}
            >
              <div className="flex items-start space-x-4">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${
                  musicProvider === 'spotify' ? 'bg-green-500/20 border-2 border-green-500/30' : 'bg-neutral3'
                }`}>
                  <MusicalNoteIcon className={`h-6 w-6 ${musicProvider === 'spotify' ? 'text-green-500' : 'text-neutral-contrast/50'}`} />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-lg">Spotify Premium</h3>
                  <p className="text-sm text-neutral-contrast/70 mt-1">
                    Search artists, playlists, and full discographies.
                  </p>
                  {canUseSpotify ? (
                    <span className="inline-block mt-2 px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded border border-green-500/30">
                      ✓ Connected
                    </span>
                  ) : (
                    <span className="inline-block mt-2 px-2 py-1 bg-yellow-500/20 text-yellow-400 text-xs rounded border border-yellow-500/30">
                      Requires Connection
                    </span>
                  )}
                </div>
              </div>
            </button>
          </div>

          {musicProvider === 'spotify' && !canUseSpotify && (
            <SpotifyConnection compact />
          )}
        </div>

        {musicProvider === 'itunes' && (
          <div className="bg-neutral2 rounded-xl border-2 border-neutral-contrast/10 p-6 space-y-4">
            <div>
              <label className="block mb-2 text-neutral-contrast/70">Search for Anything</label>
              <input
                type="text"
                placeholder='Try: "Pop", "Taylor Swift", "Summer jams of the 2000s"'
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-primary w-full"
              />
              {errors.searchTerm && <p className="text-red-500 text-sm mt-1">{errors.searchTerm}</p>}
            </div>
          </div>
        )}

        {musicProvider === 'spotify' && canUseSpotify && (
          <div className="bg-neutral2 rounded-xl border-2 border-neutral-contrast/10 p-6 space-y-4">
            <div>
              <label className="block mb-2 text-neutral-contrast/70">Search Spotify</label>
              <div className="flex space-x-2">
                <input
                  type="text"
                  placeholder='Search for artists or playlists...'
                  value={spotifyQuery}
                  onChange={(e) => setSpotifyQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSpotifySearch()}
                  className="input-primary flex flex-8"
                />
                <button
                  onClick={handleSpotifySearch}
                  disabled={isSearching || !spotifyQuery.trim()}
                  className={`flex flex-1 ${isSearching || !spotifyQuery.trim() ? 'btn-disabled px-6' : 'btn-primary px-6'}`}
                >
                  {isSearching ? <Loader /> : <MagnifyingGlassIcon className="h-5 w-5" />}
                </button>
              </div>
              {errors.spotifyQuery && <p className="text-red-500 text-sm mt-1">{errors.spotifyQuery}</p>}
            </div>

            {selectedSource && (
              <div className="bg-green-500/10 border-2 border-green-500/20 rounded-lg p-4">
                <p className="text-sm text-neutral-contrast/70 mb-2">Selected Source:</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-green-500/20 rounded-full flex items-center justify-center border-2 border-green-500/30">
                      {selectedSource.type === 'artist' ? (
                        <UserGroupIcon className="h-5 w-5 text-green-500" />
                      ) : (
                        <MusicalNoteIcon className="h-5 w-5 text-green-500" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-neutral-contrast">{selectedSource.name}</p>
                      <p className="text-xs text-neutral-contrast/60 capitalize">{selectedSource.type}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedSource(null)}
                    className="text-sm text-red-400 hover:text-red-300"
                  >
                    Clear
                  </button>
                </div>
              </div>
            )}

            {searchResults && (
              <div className="space-y-4">
                {searchResults.artists.length > 0 && (
                  <div>
                    <h3 className="text-lg font-medium text-neutral-contrast mb-3">Artists</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {searchResults.artists.map((artist) => (
                        <button
                          key={artist.id}
                          onClick={() => handleSelectArtist(artist.id, artist.name)}
                          className={`p-4 rounded-lg border-2 transition-all text-left ${
                            selectedSource?.id === artist.id
                              ? 'border-green-500 bg-green-500/10'
                              : 'border-neutral-contrast/10 hover:border-primary/50 bg-neutral3'
                          }`}
                        >
                          <div className="flex items-center space-x-3">
                            {artist.images[0]?.url ? (
                              <img
                                src={artist.images[0].url}
                                alt={artist.name}
                                className="w-12 h-12 rounded-full object-cover"
                              />
                            ) : (
                              <div className="w-12 h-12 bg-neutral2 rounded-full flex items-center justify-center">
                                <UserGroupIcon className="h-6 w-6 text-neutral-contrast/50" />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-neutral-contrast truncate">{artist.name}</p>
                              <p className="text-xs text-neutral-contrast/60">
                                {artist.genres.slice(0, 2).join(', ') || 'Artist'}
                              </p>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {searchResults.playlists.length > 0 && (
                  <div>
                    <h3 className="text-lg font-medium text-neutral-contrast mb-3">Playlists</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {searchResults.playlists.map((playlist) => (
                        <button
                          key={playlist.id}
                          onClick={() => handleSelectPlaylist(playlist.id, playlist.name)}
                          className={`p-4 rounded-lg border-2 transition-all text-left ${
                            selectedSource?.id === playlist.id
                              ? 'border-green-500 bg-green-500/10'
                              : 'border-neutral-contrast/10 hover:border-primary/50 bg-neutral3'
                          }`}
                        >
                          <div className="flex items-center space-x-3">
                            {playlist.images[0]?.url ? (
                              <img
                                src={playlist.images[0].url}
                                alt={playlist.name}
                                className="w-12 h-12 rounded object-cover"
                              />
                            ) : (
                              <div className="w-12 h-12 bg-neutral2 rounded flex items-center justify-center">
                                <MusicalNoteIcon className="h-6 w-6 text-neutral-contrast/50" />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-neutral-contrast truncate">{playlist.name}</p>
                              <p className="text-xs text-neutral-contrast/60">
                                {playlist.tracks.total} tracks • by {playlist.owner.display_name}
                              </p>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
        
        <div className="bg-neutral2 rounded-xl border-2 border-neutral-contrast/10 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-neutral-contrast/70">Artist Guessing</span>

            <div className="flex items-center gap-3">
              <span className="text-sm text-neutral-contrast/70">
                {guessArtist ? "ON" : "OFF"}
              </span>

              <button
                type="button"
                onClick={() => setGuessArtist(!guessArtist)}
                className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors duration-300 
                  ${guessArtist ? 'bg-primary' : 'bg-neutral3'}`}
              >
                <span
                  className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform duration-300
                    ${guessArtist ? 'translate-x-7' : 'translate-x-1'}`}
                />
              </button>
            </div>
          </div>
        </div>

        <div className="bg-neutral2 rounded-xl border-2 border-neutral-contrast/10 p-6 space-y-6">
          <div>
            <label className="block mb-2 text-neutral-contrast/70">Number of Tracks</label>
            <input
              type="number"
              value={trackCount}
              min={MIN_TRACKS}
              max={MAX_TRACKS}
              onChange={(e) => setTrackCount(Number(e.target.value))}
              className="input-primary w-full"
            />
            {errors.trackCount && <p className="text-red-500 text-sm mt-1">{errors.trackCount}</p>}
          </div>

          <div>
            <label className="block mb-2 text-neutral-contrast/70">Round Duration (seconds)</label>
            <input
              type="number"
              value={roundDuration}
              onChange={(e) => setRoundDuration(Number(e.target.value))}
              className="input-primary w-full"
            />
            {errors.roundDuration && <p className="text-red-500 text-sm mt-1">{errors.roundDuration}</p>}
          </div>
        </div>

        <button
          onClick={handleStartGame}
          disabled={loadingGame || isLoadingArtist || isLoadingPlaylist}
          className={loadingGame || isLoadingArtist || isLoadingPlaylist ? "btn-disabled w-full" : "btn-primary w-full"}
        >
          {loadingGame || isLoadingArtist || isLoadingPlaylist ? <Loader /> : "Start Game"}
        </button>
      </div>
    </motion.div>
  );
};

export default IpodWarSettings;