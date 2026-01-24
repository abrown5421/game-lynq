export interface ISessionPlayer {
  userId?: string;
  unId?: string;
  name: string;
  connected: boolean;
  joinedAt: string;
}

export interface IGameState {
  type: string;
  data: any;
  round?: number;
  scores?: Record<string, number>;
  phase?: string;
}

export type SessionStatus = "lobby" | "selectGame" | "settings" | "playing" | "ended";

export interface ISession {
  _id: string;
  code: string;
  hostId: string;
  status: SessionStatus;
  players: ISessionPlayer[];
  selectedGameId?: string;
  gameState?: IGameState;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSessionDto { hostId: string; }
export interface JoinSessionDto { code: string; name: string; userId?: string; unId?: string; }
export interface LeaveSessionDto { playerName: string; }
export interface RemovePlayerDto { playerName: string; }
export interface UpdatePlayerNameDto { oldName: string; newName: string; }
export interface SelectGameDto { gameId: string; }
export interface GameActionDto {
  action: "updatePhase" | "updateScore" | "incrementRound" | "updateData";
  payload: { phase?: string; playerId?: string; score?: number; data?: any; };
}
