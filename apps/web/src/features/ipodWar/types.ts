export interface Track {
  name: string;
  artist: string;
  previewUrl: string;
  artwork: string;
}

export interface PlayerSubmission {
  playerId: string;
  playerName: string;
  trackGuess: string;
  artistGuess: string;
  submittedAt: number;
  trackCorrect?: boolean;
  artistCorrect?: boolean;
  points?: number;
}

export interface IpodWarGameData {
  currentTrack: Track | null;
  revealedAnswer: {
    track: Track;
    submissions: PlayerSubmission[];
  } | null;
  readyPlayers: string[];
  round: number;
  tracks: Track[];
  settings: {
    genre: string;
    trackCount: number;
    roundDuration: number;
  };
  submissions: PlayerSubmission[];
  roundStartTime: number | null;
  phase: 'playing' | 'revealing' | 'waiting';
}