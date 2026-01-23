export interface ISessionPlayer {
  userId?: string;
  unId?: string;
  name: string;
  connected: boolean;
  joinedAt: string;
}

export type SessionStatus = "lobby" | "playing" | "ended";

export interface ISession {
  _id: string;
  code: string;
  hostId: string;
  status: SessionStatus;
  players: ISessionPlayer[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateSessionDto {
  hostId: string;
}

export interface JoinSessionDto {
  code: string;
  name: string;
  userId?: string;
  unId?: string;
}

export interface LeaveSessionDto {
  playerName: string;
}

export interface RejoinSessionDto {
  code: string;
  name: string;
}

export interface RemovePlayerDto {
  playerName: string;
}

export interface UpdatePlayerNameDto {
  oldName: string;
  newName: string;
}