import mongoose, { Schema, Document } from "mongoose";
import crypto from "crypto";

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || "change-this-to-32-character-key!!"; 
const ALGORITHM = "aes-256-cbc";

export interface ISpotifyConnection extends Document {
  userId: mongoose.Types.ObjectId;
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
  scope: string;
  spotifyUserId: string;
  spotifyEmail?: string;
  spotifyDisplayName?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  
  encrypt(text: string): string;
  decrypt(text: string): string;
  isExpired(): boolean;
  getDecryptedAccessToken(): string;
  getDecryptedRefreshToken(): string;
}

const SpotifyConnectionSchema = new Schema<ISpotifyConnection>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    accessToken: { type: String, required: true },
    refreshToken: { type: String, required: true },
    expiresAt: { type: Date, required: true },
    scope: { type: String, required: true },
    spotifyUserId: { type: String, required: true },
    spotifyEmail: { type: String },
    spotifyDisplayName: { type: String },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

SpotifyConnectionSchema.pre<ISpotifyConnection>("save", function () {
  if (this.isModified("accessToken") && !this.accessToken.includes(":")) {
    this.accessToken = this.encrypt(this.accessToken);
  }
  if (this.isModified("refreshToken") && !this.refreshToken.includes(":")) {
    this.refreshToken = this.encrypt(this.refreshToken);
  }
});

SpotifyConnectionSchema.methods.encrypt = function (text: string): string {
  const iv = crypto.randomBytes(16);
  const key = Buffer.from(ENCRYPTION_KEY.padEnd(32, "0").slice(0, 32));
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  return `${iv.toString("hex")}:${encrypted}`;
};

SpotifyConnectionSchema.methods.decrypt = function (text: string): string {
  const [ivHex, encryptedText] = text.split(":");
  const iv = Buffer.from(ivHex, "hex");
  const key = Buffer.from(ENCRYPTION_KEY.padEnd(32, "0").slice(0, 32));
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  let decrypted = decipher.update(encryptedText, "hex", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
};

SpotifyConnectionSchema.methods.isExpired = function (): boolean {
  return new Date() >= this.expiresAt;
};

SpotifyConnectionSchema.methods.getDecryptedAccessToken = function (): string {
  return this.decrypt(this.accessToken);
};

SpotifyConnectionSchema.methods.getDecryptedRefreshToken = function (): string {
  return this.decrypt(this.refreshToken);
};

export const SpotifyConnectionModel = mongoose.model<ISpotifyConnection>(
  "SpotifyConnection",
  SpotifyConnectionSchema
);