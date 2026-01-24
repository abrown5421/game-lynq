import mongoose, { Schema, Document } from "mongoose";

export interface ISessionPlayer {
  userId?: mongoose.Types.ObjectId;
  unId?: string;
  name: string;
  connected: boolean;
  joinedAt: Date;
}

export interface IGameState {
  type: string;
  data: any;
  round?: number;
  scores?: Record<string, number>;
  phase?: string;
}

export type SessionStatus = "lobby" | "selectGame" | "settings" | "playing" | "ended";

export interface ISession extends Document {
  code: string;
  hostId: mongoose.Types.ObjectId;
  status: SessionStatus;
  players: ISessionPlayer[];
  selectedGameId?: mongoose.Types.ObjectId;
  gameState?: IGameState;
  createdAt: Date;
  updatedAt: Date;
}

const PlayerSchema = new Schema<ISessionPlayer>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User" },
    unId: { type: String },
    name: { type: String, required: true },
    connected: { type: Boolean, default: true },
    joinedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const GameStateSchema = new Schema(
  {
    type: { type: String, required: true },
    data: { type: Schema.Types.Mixed, default: {} },
    round: { type: Number, default: 0 },
    scores: { type: Map, of: Number, default: {} },
    phase: { type: String },
  },
  { _id: false }
);

const SessionSchema = new Schema<ISession>(
  {
    code: { type: String, unique: true, index: true },
    hostId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    status: {
      type: String,
      enum: ["lobby", "selectGame", "settings", "playing", "ended"],
      default: "lobby",
    },
    players: { type: [PlayerSchema], default: [] },
    selectedGameId: { type: Schema.Types.ObjectId, ref: "Game" },
    gameState: { type: GameStateSchema },
  },
  { timestamps: true }
);

export const SessionModel = mongoose.model<ISession>("Session", SessionSchema);
