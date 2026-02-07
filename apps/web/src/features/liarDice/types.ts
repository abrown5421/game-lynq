export interface Die {
  value: number; // 1-6
  id: string;
}

export interface PlayerDice {
  playerId: string;
  playerName: string;
  dice: Die[];
  diceCount: number;
}

export interface Bid {
  playerId: string;
  playerName: string;
  quantity: number;
  faceValue: number; // 1-6
  timestamp: number;
}

export interface RoundResult {
  challenger: string;
  challengerName: string;
  bidder: string;
  bidderName: string;
  bid: Bid;
  actualCount: number;
  wasCorrect: boolean;
  loser: string;
  loserName: string;
  allPlayerDice: PlayerDice[];
}

export interface LiarsDiceGameData {
  phase: 'playing' | 'revealing' | 'gameOver';
  round: number;
  playerDice: PlayerDice[];
  currentBid: Bid | null;
  currentTurnPlayerId: string;
  biddingHistory: Bid[];
  roundResult: RoundResult | null;
  settings: {
    startingDice: number;
    onesAreWild: boolean;
  };
  eliminatedPlayers: string[];
  winner: {
    playerId: string;
    playerName: string;
  } | null;
}