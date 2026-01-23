import mongoose, { Schema, Document } from "mongoose";

export interface ISessionPlayer {
  userId?: mongoose.Types.ObjectId;
  unId?: string; 
  name: string;
  connected: boolean;
  joinedAt: Date;
}

export interface ISession extends Document {
  code: string; 
  hostId: mongoose.Types.ObjectId;
  status: "lobby" | "playing" | "ended";
  players: ISessionPlayer[];
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

const SessionSchema = new Schema<ISession>(
  {
    code: { type: String, unique: true, index: true },
    hostId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    status: { type: String, default: "lobby" },
    players: { type: [PlayerSchema], default: [] },
  },
  { timestamps: true }
);

export const SessionModel = mongoose.model<ISession>(
  "Session",
  SessionSchema
);