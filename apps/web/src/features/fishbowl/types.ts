export interface FishbowlWord {
  text: string;
  submittedBy: string;
  guessedInRound?: number;
}

export interface FishbowlTeam {
  name: string;
  players: string[];
}

export interface FishbowlGameData {
  phase: 'word-submission' | 'team-assignment' | 'round-intro' | 'playing' | 'turn-end' | 'round-end' | 'finished';
  teams: {
    team1: FishbowlTeam;
    team2: FishbowlTeam;
  };
  fishbowl: FishbowlWord[];
  remainingWords: FishbowlWord[];
  currentWord: FishbowlWord | null;
  currentTeam: 'team1' | 'team2';
  currentPlayer: string | null;
  turnStartTime: number | null;
  scores: {
    team1: number;
    team2: number;
  };
  wordsGuessedThisTurn: FishbowlWord[];
  wordsSkippedThisTurn: FishbowlWord[];
  wordsSubmitted: Record<string, string[]>;
  currentRound: number;
  roundHistory: Array<{
    round: number;
    team1Score: number;
    team2Score: number;
    wordsGuessed: number;
  }>;
  settings?: {
    wordsPerPlayer: number;
    turnDuration: number;
    allowSkips: boolean;
  };
}