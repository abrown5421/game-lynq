import mongoose, { Schema, Document } from "mongoose";

export interface IGame extends Document {
  name: string;
  description: string;
  minPlayers: number;
  maxPlayers: number;
  image?: string;
  config: {
    initialState: any;
    initialPhase?: string;
    [key: string]: any;
  };
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const GameSchema = new Schema<IGame>(
  {
    name: { type: String, required: true },
    description: { type: String, required: true },
    minPlayers: { type: Number, default: 1 },
    maxPlayers: { type: Number, default: 10 },
    image: { type: String },
    config: { type: Schema.Types.Mixed, default: {} },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const GameModel = mongoose.model<IGame>("Game", GameSchema);